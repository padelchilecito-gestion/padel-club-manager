const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');

// ✅ Importación correcta para date-fns-tz v3.x
const { startOfDay, endOfDay, parseISO, addMinutes, parse } = require('date-fns');
const { fromZonedTime } = require('date-fns-tz');

const createBooking = async (req, res) => {
  console.log('--- Recibido en POST /api/bookings ---');
  console.log('req.body:', JSON.stringify(req.body, null, 2));

  const { slots, user, paymentMethod } = req.body;

  // Validación mejorada
  if (!slots || !Array.isArray(slots) || slots.length === 0) {
    console.error('❌ Validación fallida: slots inválido');
    return res.status(400).json({ message: 'Debe proporcionar al menos un turno.' });
  }

  if (!user || typeof user !== 'object' || !user.name || !user.lastName || !user.phone) {
    console.error('❌ Validación fallida: datos de usuario incompletos');
    return res.status(400).json({ message: 'Debe proporcionar nombre, apellido y teléfono.' });
  }

  if (!paymentMethod) {
    console.error('❌ Validación fallida: método de pago no especificado');
    return res.status(400).json({ message: 'Debe especificar un método de pago.' });
  }

  try {
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    const timeZone = 'America/Argentina/Buenos_Aires';

    // Validar que los slots tengan los campos necesarios
    if (!firstSlot.courtId || !firstSlot.startTime || !firstSlot.date) {
      console.error('❌ Slot inválido:', firstSlot);
      return res.status(400).json({ message: 'Los turnos tienen datos incompletos.' });
    }

    const court = await Court.findById(firstSlot.courtId);
    if (!court) {
      console.error('❌ Cancha no encontrada:', firstSlot.courtId);
      return res.status(404).json({ message: 'Cancha no encontrada.' });
    }

    // ✅ Usar fromZonedTime (date-fns-tz v3.x)
    const startTime = fromZonedTime(`${firstSlot.date}T${firstSlot.startTime}`, timeZone);

    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { 
      acc[setting.key] = setting.value; 
      return acc; 
    }, {});
    
    const slotDuration = parseInt(settings.slotDuration, 10);

    if (!slotDuration || slotDuration <= 0) {
      console.error('❌ slotDuration inválido:', settings.slotDuration);
      return res.status(500).json({ message: 'Error de configuración: duración de turno inválida.' });
    }

    const baseDateForCalc = '1970-01-01';
    const lastSlotTimeAsDate = parse(`${baseDateForCalc}T${lastSlot.startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
    const endTimeFromLastSlot = addMinutes(lastSlotTimeAsDate, slotDuration);

    const endTime = fromZonedTime(
      `${lastSlot.date}T${endTimeFromLastSlot.getHours().toString().padStart(2,'0')}:${endTimeFromLastSlot.getMinutes().toString().padStart(2,'0')}:00`,
      timeZone
    );

    if (!startTime || !endTime || startTime >= endTime) {
      console.error('❌ Error en cálculo de fechas:', { startTime, endTime, firstSlot, lastSlot, slotDuration });
      return res.status(400).json({ message: 'Error en el cálculo de horarios.' });
    }

    // Verificar conflictos de reserva
    const conflictingBooking = await Booking.findOne({
      court: firstSlot.courtId,
      status: { $ne: 'Cancelled' },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ],
    });

    if (conflictingBooking) {
      console.warn('⚠️ Conflicto de reserva:', conflictingBooking._id);
      return res.status(409).json({ message: 'Uno o más turnos ya están reservados.' });
    }

    const totalPrice = slots.reduce((total, slot) => total + (slot.price || 0), 0);

    const booking = new Booking({
      court: firstSlot.courtId,
      user: {
        name: user.name,
        lastName: user.lastName, // Guardando el apellido
        phone: user.phone,
      },
      startTime: startTime,
      endTime: endTime,
      price: totalPrice,
      paymentMethod: paymentMethod,
      isPaid: paymentMethod === 'MercadoPago',
      status: 'Confirmed',
    });

    const createdBooking = await booking.save();
    console.log('✅ Reserva creada exitosamente:', createdBooking._id);

    const io = req.app.get('socketio');
    if (io) io.emit('booking_update', createdBooking);

    await logActivity('Booking', createdBooking._id, 'create', { 
      user: createdBooking.user, 
      court: court.name, 
      date: firstSlot.date 
    });

    if (createdBooking.user.phone) {
      try {
        const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva en ${settings.clubName || 'Padel Club'} ha sido confirmada.\n\nFecha: ${firstSlot.date}\nHorario: ${firstSlot.startTime}\nTotal: $${totalPrice}\n\n¡Te esperamos!`;

        await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
      } catch (notificationError) {
        console.error("❌ Error enviando WhatsApp:", notificationError);
      }
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error('❌ Error fatal en createBooking:', error);
    res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
};

const getBookingAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'Falta parámetro ?date=YYYY-MM-DD' });
    
    const timeZone = 'America/Argentina/Buenos_Aires';
    const dateObj = parseISO(date);
    
    if (isNaN(dateObj)) return res.status(400).json({ message: 'Formato de fecha inválido.' });
    
    const start = fromZonedTime(startOfDay(dateObj), timeZone);
    const end = fromZonedTime(endOfDay(dateObj), timeZone);
    
    const bookings = await Booking.find({ 
      startTime: { $gte: start, $lt: end }, 
      status: { $ne: 'Cancelled' } 
    }).populate('court', 'name');
    
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error en getBookingAvailability:", error);
    res.status(500).json({ message: 'Error interno al obtener disponibilidad.', error: error.message });
  }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate('court', 'name courtType')
      .sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error obteniendo todas las reservas:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('court');
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(`Error obteniendo reserva ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      const allowedStatus = ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'NoShow'];
      if (req.body.status && !allowedStatus.includes(req.body.status)) {
        return res.status(400).json({ message: 'Estado inválido.' });
      }
      
      booking.status = req.body.status || booking.status;
      
      if (req.body.isPaid === true || req.body.isPaid === false) {
        booking.isPaid = req.body.isPaid;
      }

      // --- CAMBIO AQUÍ ---
      // Si se está marcando como pagado y se envía un método de pago, actualizarlo.
      if (req.body.isPaid === true && req.body.paymentMethod) {
        // (Validación extra opcional: verificar si req.body.paymentMethod está en el enum)
        booking.paymentMethod = req.body.paymentMethod;
      }
      // --- FIN DEL CAMBIO ---
      
      const updatedBooking = await booking.save();
      
      const io = req.app.get('socketio');
      if (io) io.emit('booking_update', updatedBooking);
      
      await logActivity('Booking', updatedBooking._id, 'update', { status: updatedBooking.status, isPaid: updatedBooking.isPaid });
      
      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(`Error actualizando estado reserva ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      if (booking.status === 'Cancelled') {
        return res.status(400).json({ message: 'La reserva ya está cancelada.' });
      }
      
      booking.status = 'Cancelled';
      const updatedBooking = await booking.save();
      
      const io = req.app.get('socketio');
      if (io) io.emit('booking_update', updatedBooking);
      
      await logActivity('Booking', updatedBooking._id, 'cancel', {});
      
      res.json({ message: 'Booking cancelled successfully' });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(`Error cancelando reserva ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
};
