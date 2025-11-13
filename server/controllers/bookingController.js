const mongoose = require('mongoose'); // <-- Asegúrate de importar mongoose
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting'); 
// const { sendWhatsAppMessage } = require('../utils/notificationService'); // (Ya lo habíamos quitado)
const { logActivity } = require('../utils/logActivity');
const { utcToZonedTime, zonedTimeToUtc } = require('date-fns-tz');

// Definimos la zona horaria del negocio
const timeZone = 'America/Argentina/Buenos_Aires';

// --- createBooking (sin cambios) ---
const createBooking = async (req, res) => {
  // ... (tu código de createBooking existente) ...
  // Esta función ahora solo crea UNA reserva.
  const { courtId, user, startTime, endTime, paymentMethod, isPaid, price } = req.body;

  try {
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    const conflictingBooking = await Booking.findOne({
      court: courtId,
      status: { $ne: 'Cancelled' },
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({ message: 'The selected time slot is already booked.' });
    }
    
    let finalPrice = price; 
    if (finalPrice === undefined && req.body.totalPrice !== undefined) {
        finalPrice = req.body.totalPrice;
    }

    if (finalPrice === undefined) {
      const durationHours = (end - start) / (1000 * 60 * 60);
      finalPrice = durationHours * court.pricePerHour;
    }

    const booking = new Booking({
      court: courtId,
      user,
      startTime: start,
      endTime: end,
      price: finalPrice,
      paymentMethod,
      isPaid: isPaid || false,
      status: 'Confirmed',
      // recurringGroupId: null (es el default)
    });

    const createdBooking = await booking.save();
    
    const io = req.app.get('socketio');
    io.emit('booking_update', createdBooking);
    
    if (req.user) {
        const logDetails = `Booking created for ${createdBooking.user.name} on court '${court.name}' from ${start.toLocaleString()} to ${end.toLocaleString()}.`;
        await logActivity(req.user, 'BOOKING_CREATED', logDetails);
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// --- getBookingAvailability (sin cambios) ---
const getBookingAvailability = async (req, res) => {
    // ... (tu código existente) ...
};

// --- getBookings (sin cambios) ---
const getBookings = async (req, res) => {
    // ... (tu código existente con paginación) ...
};

// --- updateBooking (sin cambios) ---
const updateBooking = async (req, res) => {
    // ... (tu código existente) ...
};

// --- updateBookingStatus (sin cambios) ---
const updateBookingStatus = async (req, res) => {
    // ... (tu código existente) ...
};

// --- cancelBooking (sin cambios) ---
const cancelBooking = async (req, res) => {
    // ... (tu código existente) ...
};

// --- getPublicAvailabilitySlots (sin cambios) ---
const getPublicAvailabilitySlots = async (req, res) => {
    // ... (tu código existente) ...
};

// --- getPublicCourtOptions (sin cambios) ---
const getPublicCourtOptions = async (req, res) => {
    // ... (tu código existente) ...
};


// ---
// --- NUEVAS FUNCIONES PARA RESERVAS FIJAS ---
// ---

/**
 * @desc    Create a series of recurring bookings
 * @route   POST /api/bookings/recurring
 * @access  Operator/Admin
 */
const createRecurringBooking = async (req, res) => {
  const { bookingData, weeks } = req.body;
  const { courtId, user, startTime, endTime, price, paymentMethod, isPaid } = bookingData;
  
  if (!weeks || weeks < 1 || weeks > 52) { // Límite de 1 año
    return res.status(400).json({ message: 'El número de semanas debe estar entre 1 y 52.' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const court = await Court.findById(courtId).session(session);
    if (!court) {
      throw new Error('Court not found');
    }

    const bookingsToCreate = [];
    const conflictErrors = [];
    const recurringGroupId = new mongoose.Types.ObjectId().toString(); // ID único para la serie
    const oneWeekInMs = 7 * 24 * 60 * 60 * 1000;

    const originalStartTime = new Date(startTime);
    const originalEndTime = new Date(endTime);
    
    for (let i = 0; i < weeks; i++) {
      const newStartTime = new Date(originalStartTime.getTime() + (i * oneWeekInMs));
      const newEndTime = new Date(originalEndTime.getTime() + (i * oneWeekInMs));

      // 1. Validar conflicto para *cada* fecha futura
      const conflictingBooking = await Booking.findOne({
        court: courtId,
        status: { $ne: 'Cancelled' },
        $or: [
          { startTime: { $lt: newEndTime, $gte: newStartTime } },
          { endTime: { $gt: newStartTime, $lte: newEndTime } },
          { startTime: { $lte: newStartTime }, endTime: { $gte: newEndTime } }
        ],
      }).session(session);

      if (conflictingBooking) {
        conflictErrors.push(newStartTime.toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' }));
      } else {
        bookingsToCreate.push({
          court: courtId,
          user,
          startTime: newStartTime,
          endTime: newEndTime,
          price,
          paymentMethod,
          isPaid,
          status: 'Confirmed',
          recurringGroupId: recurringGroupId, // Asignamos el ID de la serie
        });
      }
    }

    // Si encontramos *alguno* conflicto, abortamos toda la operación
    if (conflictErrors.length > 0) {
      throw new Error(`No se pudo crear la serie. Los siguientes horarios ya están ocupados: ${conflictErrors.join(', ')}`);
    }
    
    if (bookingsToCreate.length === 0) {
       throw new Error('No se generaron reservas. Revise los datos.');
    }

    // 2. Insertar todas las reservas a la vez
    const createdBookings = await Booking.insertMany(bookingsToCreate, { session });

    await session.commitTransaction();
    session.endSession();

    // 3. Emitir socket (solo el primer turno, la UI refrescará)
    const io = req.app.get('socketio');
    io.emit('booking_update', createdBookings[0]); // El frontend recargará
    
    // 4. Registrar log
    if (req.user) {
        const logDetails = `User '${req.user.username}' created a recurring booking series (${createdBookings.length} weeks) for ${user.name} on court '${court.name}'. Group ID: ${recurringGroupId}`;
        await logActivity(req.user, 'BOOKING_CREATED', logDetails);
    }

    res.status(201).json({ 
      message: `Serie de ${createdBookings.length} reservas creada con éxito.`, 
      bookings: createdBookings 
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Error creating recurring booking:', error.message);
    res.status(409).json({ message: error.message }); // 409 (Conflicto) es bueno para esto
  }
};


/**
 * @desc    Delete an entire series of recurring bookings
 * @route   DELETE /api/bookings/recurring/:groupId
 * @access  Operator/Admin
 */
const deleteRecurringBooking = async (req, res) => {
    const { groupId } = req.params;

    try {
        if (!groupId) {
            return res.status(400).json({ message: 'Group ID es requerido.' });
        }

        const result = await Booking.deleteMany({ recurringGroupId: groupId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: 'No se encontraron reservas para esa serie.' });
        }

        const io = req.app.get('socketio');
        io.emit('booking_series_deleted'); // Emitimos un evento genérico
            
        if (req.user) {
            const logDetails = `User '${req.user.username}' deleted a recurring booking series. Group ID: ${groupId}. Total deleted: ${result.deletedCount}.`;
            await logActivity(req.user, 'BOOKING_CANCELLED', logDetails); // Usamos CANCELLED como log
        }

        res.json({ message: `Serie de ${result.deletedCount} reservas eliminada con éxito.` });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
  createBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
  getPublicAvailabilitySlots,
  getPublicCourtOptions,
  // --- EXPORTAR NUEVAS FUNCIONES ---
  createRecurringBooking,
  deleteRecurringBooking,
  // --------------------------------
};
