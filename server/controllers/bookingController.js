const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting'); // Importar Setting para obtener slotDuration
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
// --- CORRECCIÓN DE IMPORTACIÓN ---
const { startOfDay, endOfDay, parseISO, addMinutes, parse } = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');
// --- FIN DE CORRECCIÓN ---

const createBooking = async (req, res) => {
  const { slots, user, paymentMethod } = req.body;
  if (!slots || slots.length === 0 || !user || !paymentMethod) {
    return res.status(400).json({ message: 'Faltan datos para la reserva.' });
  }

  try {
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    const timeZone = 'America/Argentina/Buenos_Aires';
    const court = await Court.findById(firstSlot.courtId);
    if (!court) return res.status(404).json({ message: 'Court not found' });

    // --- CORRECCIÓN DE USO ---
    // Calcular startTime UTC
    const startTime = zonedTimeToUtc(`${firstSlot.date}T${firstSlot.startTime}`, timeZone);

    // Obtener slotDuration de la configuración
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {});
    const slotDuration = parseInt(settings.slotDuration, 10);
    
    // Validar slotDuration
    if (!slotDuration || slotDuration <= 0) {
        console.error('Error en createBooking: slotDuration inválido o no encontrado en settings:', settings.slotDuration);
        return res.status(500).json({ message: 'Error de configuración interna del servidor (duración de turno).' });
    }

    // Calcular endTime UTC
    // Usamos 'parse' de date-fns para tratar la hora del último slot
    const baseDateForCalc = '1970-01-01'; // Fecha dummy solo para el cálculo con addMinutes
    const lastSlotTimeAsDate = parse(`${baseDateForCalc}T${lastSlot.startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
    const endTimeFromLastSlot = addMinutes(lastSlotTimeAsDate, slotDuration); // addMinutes de date-fns

    // Convertir la hora de fin calculada a UTC en la fecha correcta
    const endTime = zonedTimeToUtc(
        `${lastSlot.date}T${endTimeFromLastSlot.getHours().toString().padStart(2,'0')}:${endTimeFromLastSlot.getMinutes().toString().padStart(2,'0')}:00`, // Añadimos segundos
        timeZone
    );
    // --- FIN DE CORRECCIÓN ---

    if (!startTime || !endTime || startTime >= endTime) {
       console.error('Error en cálculo de fechas:', { startTime, endTime, firstSlot, lastSlot, slotDuration });
       return res.status(400).json({ message: 'Error en el cálculo de la hora de inicio o fin.' });
    }

    // Check for conflicting bookings
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
        console.warn('Conflicto de reserva detectado:', { courtId: firstSlot.courtId, startTime, endTime, conflictingBooking });
        return res.status(409).json({ message: 'Uno o más de los turnos seleccionados ya fueron reservados mientras confirmabas.' });
    }

    const totalPrice = slots.reduce((total, slot) => total + slot.price, 0);
    const booking = new Booking({
      court: firstSlot.courtId,
      user: {
        name: user.name,
        lastName: user.lastName,
        phone: user.phone,
      },
      startTime: startTime,
      endTime: endTime,
      price: totalPrice,
      paymentMethod: paymentMethod,
      isPaid: paymentMethod === 'MercadoPago', // Asume pago inmediato con MP
      status: 'Confirmed',
    });

    const createdBooking = await booking.save();

    // Notificar via Socket.IO
    const io = req.app.get('socketio');
    if (io) {
        io.emit('booking_update', createdBooking);
    } else {
        console.warn('Socket.IO no encontrado en app context al crear reserva.');
    }

    // Log de actividad (si está implementado)
    // const logDetails = `Reserva creada para ${user.name} ${user.lastName}...`;
    // await logActivity(null, 'BOOKING_CREATED', logDetails); // null para usuario público

    // Notificación WhatsApp (si está implementado y configurado)
    if (createdBooking.user.phone && process.env.TWILIO_ACCOUNT_SID) { // Chequear si Twilio está configurado
        try {
            const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva en ${settings.clubName || 'Padel Club'} para la cancha "${court.name}" el ${startTime.toLocaleString('es-AR', { timeZone })} ha sido confirmada. Total: $${totalPrice}. ¡Te esperamos!`;
            // await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
        } catch (notificationError) {
            console.error("Error enviando notificación WhatsApp:", notificationError);
            // No fallar la reserva por esto
        }
    }

    res.status(201).json(createdBooking);
  } catch (error) {
     console.error('Error fatal en createBooking:', error);
     res.status(500).json({ message: 'Error interno del servidor al crear la reserva.', error: error.message });
  }
};


/* --- CÓDIGO ORIGINAL (Recuperado y corregido) --- */
const getBookingAvailability = async (req, res) => {
    try {
        const { date } = req.query; // Espera 'date' como query param (ej: /api/bookings/availability?date=yyyy-mm-dd)
        if (!date) return res.status(400).json({ message: 'La fecha es requerida como parámetro query ?date=YYYY-MM-DD' });
        
        const timeZone = 'America/Argentina/Buenos_Aires';
        // --- CORRECCIÓN DE LÓGICA ---
        const dateObj = parseISO(date);
        if (isNaN(dateObj)) { // Validar que la fecha sea válida
             return res.status(400).json({ message: 'Formato de fecha inválido. Usar YYYY-MM-DD.' });
        }
        const start = zonedTimeToUtc(startOfDay(dateObj), timeZone);
        const end = zonedTimeToUtc(endOfDay(dateObj), timeZone);
        // --- FIN DE CORRECCIÓN ---
        
        // Busca reservas en TODAS las canchas para esa fecha
        const bookings = await Booking.find({ 
            startTime: { $gte: start, $lt: end }, 
            status: { $ne: 'Cancelled' } 
        }).populate('court', 'name'); // Poblar solo el nombre de la cancha
        
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error en getBookingAvailability:", error);
        res.status(500).json({ message: 'Error interno al obtener disponibilidad general.', error: error.message });
    }
};

// @desc    Get all bookings (Admin)
const getBookings = async (req, res) => {
  try {
    // Poblar más detalles si es necesario para el admin
    const bookings = await Booking.find({}).populate('court', 'name courtType').sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error obteniendo todas las reservas (admin):', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single booking by ID (Admin)
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

// @desc    Update booking status (Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      // Validar status si es necesario
      const allowedStatus = ['Confirmed', 'Pending', 'Cancelled', 'Completed', 'NoShow'];
      if (req.body.status && !allowedStatus.includes(req.body.status)) {
         return res.status(400).json({ message: 'Estado inválido proporcionado.' });
      }

      booking.status = req.body.status || booking.status;
      // Actualizar isPaid solo si se envía explícitamente true o false
      if (req.body.isPaid === true || req.body.isPaid === false) {
          booking.isPaid = req.body.isPaid;
      }

      const updatedBooking = await booking.save();

      // Notificar via Socket.IO
      const io = req.app.get('socketio');
      if (io) {
        io.emit('booking_update', updatedBooking);
      } else {
         console.warn('Socket.IO no encontrado en app context al actualizar reserva.');
      }

      // Log de actividad (si req.user existe - middleware protect)
      // const userPerformingAction = req.user ? req.user._id : null;
      // const logDetails = `Estado de reserva ${updatedBooking._id} cambiado a '${updatedBooking.status}'. Pagado: ${updatedBooking.isPaid}`;
      // await logActivity(userPerformingAction, 'BOOKING_UPDATED', logDetails);

      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(`Error actualizando estado de reserva ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel a booking (Admin)
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            if (booking.status === 'Cancelled') {
                 return res.status(400).json({ message: 'La reserva ya está cancelada.' });
            }
            booking.status = 'Cancelled';
            const updatedBooking = await booking.save();

            // Notificar via Socket.IO
            const io = req.app.get('socketio');
            if (io) {
                // Emitir evento de cancelación específico o usar el general
                io.emit('booking_update', updatedBooking); 
                // Opcional: io.emit('booking_deleted', { id: req.params.id });
            } else {
                console.warn('Socket.IO no encontrado en app context al cancelar reserva.');
            }

            // Log de actividad (si req.user existe)
            // const userPerformingAction = req.user ? req.user._id : null;
            // const logDetails = `Reserva ${updatedBooking._id} cancelada.`;
            // await logActivity(userPerformingAction, 'BOOKING_CANCELLED', logDetails);

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
  getBookingAvailability, // Asegúrate de que esta ruta esté definida en bookings.js
};
