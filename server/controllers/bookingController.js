const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting'); // Importar Setting para obtener slotDuration
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
// Importaciones de date-fns corregidas
const { startOfDay, endOfDay, parseISO, addMinutes, parse } = require('date-fns');
const { zonedTimeToUtc } = require('date-fns-tz');

const createBooking = async (req, res) => {
  // --- LOG DE DEPURACIÓN ---
  // Vamos a ver qué contiene exactamente el cuerpo de la petición
  console.log('--- Recibido en POST /api/bookings ---');
  console.log('req.body:', JSON.stringify(req.body, null, 2)); // Usamos JSON.stringify para ver la estructura
  // --- FIN DE LOG ---

  const { slots, user, paymentMethod } = req.body; // Desestructuramos DESPUÉS de loguear

  // Validación que estaba fallando
  if (!slots || !Array.isArray(slots) || slots.length === 0 || !user || typeof user !== 'object' || !paymentMethod) {
    console.error('--- VALIDACIÓN FALLIDA ---');
    console.error('Slots:', slots);
    console.error('User:', user);
    console.error('PaymentMethod:', paymentMethod);
    return res.status(400).json({ message: 'Faltan datos para la reserva o tienen formato incorrecto.' }); // Mensaje un poco más específico
  }

  // --- El resto de la función sigue igual ---
  try {
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];
    const timeZone = 'America/Argentina/Buenos_Aires';
    const court = await Court.findById(firstSlot.courtId);
    if (!court) return res.status(404).json({ message: 'Court not found' });

    // Calcular startTime UTC
    const startTime = zonedTimeToUtc(`${firstSlot.date}T${firstSlot.startTime}`, timeZone);

    // Obtener slotDuration de la configuración
    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {});
    const slotDuration = parseInt(settings.slotDuration, 10);

    if (!slotDuration || slotDuration <= 0) {
        console.error('Error en createBooking: slotDuration inválido:', settings.slotDuration);
        return res.status(500).json({ message: 'Error de configuración interna (duración).' });
    }

    // Calcular endTime UTC
    const baseDateForCalc = '1970-01-01';
    const lastSlotTimeAsDate = parse(`${baseDateForCalc}T${lastSlot.startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
    const endTimeFromLastSlot = addMinutes(lastSlotTimeAsDate, slotDuration);

    const endTime = zonedTimeToUtc(
        `${lastSlot.date}T${endTimeFromLastSlot.getHours().toString().padStart(2,'0')}:${endTimeFromLastSlot.getMinutes().toString().padStart(2,'0')}:00`,
        timeZone
    );

    if (!startTime || !endTime || startTime >= endTime) {
       console.error('Error en cálculo de fechas:', { startTime, endTime, firstSlot, lastSlot, slotDuration });
       return res.status(400).json({ message: 'Error en el cálculo de la hora.' });
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
        console.warn('Conflicto de reserva:', { courtId: firstSlot.courtId, startTime, endTime, conflictingBookingId: conflictingBooking._id });
        return res.status(409).json({ message: 'Uno o más turnos ya reservados.' });
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
      isPaid: paymentMethod === 'MercadoPago',
      status: 'Confirmed',
    });

    const createdBooking = await booking.save();

    const io = req.app.get('socketio');
    if (io) io.emit('booking_update', createdBooking);

    // ... log ...

    if (createdBooking.user.phone && process.env.TWILIO_ACCOUNT_SID) {
        try {
            const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva en ${settings.clubName || 'Padel Club'}...`;
            // await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
        } catch (notificationError) {
            console.error("Error enviando WhatsApp:", notificationError);
        }
    }

    res.status(201).json(createdBooking);
  } catch (error) {
     console.error('Error fatal en createBooking:', error);
     res.status(500).json({ message: 'Error interno del servidor al crear reserva.', error: error.message });
  }
};

// --- Resto de las funciones (getBookingAvailability, getBookings, etc.) ---
// (Asegúrate de que el código completo de estas funciones esté aquí)
const getBookingAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Falta parámetro ?date=YYYY-MM-DD' });
        const timeZone = 'America/Argentina/Buenos_Aires';
        const dateObj = parseISO(date);
        if (isNaN(dateObj)) return res.status(400).json({ message: 'Formato de fecha inválido.' });
        const start = zonedTimeToUtc(startOfDay(dateObj), timeZone);
        const end = zonedTimeToUtc(endOfDay(dateObj), timeZone);
        const bookings = await Booking.find({ startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } }).populate('court', 'name');
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error en getBookingAvailability:", error);
        res.status(500).json({ message: 'Error interno al obtener disponibilidad.', error: error.message });
    }
};

const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('court', 'name courtType').sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    console.error('Error obteniendo todas las reservas (admin):', error);
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
      const updatedBooking = await booking.save();
      const io = req.app.get('socketio');
      if (io) io.emit('booking_update', updatedBooking);
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
            if (booking.status === 'Cancelled') return res.status(400).json({ message: 'Ya cancelada.' });
            booking.status = 'Cancelled';
            const updatedBooking = await booking.save();
            const io = req.app.get('socketio');
            if (io) io.emit('booking_update', updatedBooking);
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
