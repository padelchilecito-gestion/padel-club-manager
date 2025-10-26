const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting'); // Importar Setting para obtener slotDuration
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
// --- CORRECCIÓN DE IMPORTACIÓN ---
const dateFns = require('date-fns');
const dateFnsTz = require('date-fns-tz');
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
    const startTime = dateFnsTz.zonedTimeToUtc(`${firstSlot.date}T${firstSlot.startTime}`, timeZone);

    const settingsList = await Setting.find({});
    const settings = settingsList.reduce((acc, setting) => { acc[setting.key] = setting.value; return acc; }, {});
    const slotDuration = parseInt(settings.slotDuration, 10);
    if (!slotDuration || slotDuration <= 0) {
        console.error('Error en createBooking: slotDuration inválido:', settings.slotDuration);
        return res.status(500).json({ message: 'Error de configuración interna (duración).' });
    }

    const baseDateForCalc = '1970-01-01';
    // Usamos parse de dateFns
    const lastSlotTimeAsDate = dateFns.parse(`${baseDateForCalc}T${lastSlot.startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
    // Usamos addMinutes de dateFns
    const endTimeFromLastSlot = dateFns.addMinutes(lastSlotTimeAsDate, slotDuration);

    const endTime = dateFnsTz.zonedTimeToUtc(
        `${lastSlot.date}T${endTimeFromLastSlot.getHours().toString().padStart(2,'0')}:${endTimeFromLastSlot.getMinutes().toString().padStart(2,'0')}:00`,
        timeZone
    );
    // --- FIN DE CORRECCIÓN ---

    if (!startTime || !endTime || startTime >= endTime) {
       console.error('Error en cálculo de fechas:', { startTime, endTime, firstSlot, lastSlot, slotDuration });
       return res.status(400).json({ message: 'Error en el cálculo de la hora.' });
    }

    const conflictingBooking = await Booking.findOne({ /* ... */ });
    if (conflictingBooking) {
        console.warn('Conflicto de reserva:', { /* ... */ });
        return res.status(409).json({ message: 'Turnos ya reservados.' });
    }

    const totalPrice = slots.reduce((total, slot) => total + slot.price, 0);
    const booking = new Booking({
      court: firstSlot.courtId,
      user: { name: user.name, lastName: user.lastName, phone: user.phone },
      startTime, endTime, price: totalPrice, paymentMethod,
      isPaid: paymentMethod === 'MercadoPago', status: 'Confirmed',
    });

    const createdBooking = await booking.save();

    const io = req.app.get('socketio');
    if (io) io.emit('booking_update', createdBooking);

    // ... log ...

    if (createdBooking.user.phone && process.env.TWILIO_ACCOUNT_SID) {
        try {
            const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva en ${settings.clubName || 'Padel Club'}... Total: $${totalPrice}. ¡Te esperamos!`;
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


/* --- CÓDIGO ORIGINAL (con corrección de uso) --- */
const getBookingAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'Falta parámetro ?date=YYYY-MM-DD' });

        const timeZone = 'America/Argentina/Buenos_Aires';
        // --- CORRECCIÓN DE USO ---
        const dateObj = dateFns.parseISO(date);
        if (isNaN(dateObj)) return res.status(400).json({ message: 'Formato de fecha inválido.' });
        const start = dateFnsTz.zonedTimeToUtc(dateFns.startOfDay(dateObj), timeZone);
        const end = dateFnsTz.zonedTimeToUtc(dateFns.endOfDay(dateObj), timeZone);
        // --- FIN DE CORRECCIÓN ---

        const bookings = await Booking.find({ startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' } }).populate('court', 'name');
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error en getBookingAvailability:", error);
        res.status(500).json({ message: 'Error interno al obtener disponibilidad.', error: error.message });
    }
};

// @desc    Get all bookings (Admin)
const getBookings = async (req, res) => {
  try {
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

      // ... log ...

      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(`Error actualizando estado reserva ${req.params.id}:`, error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel a booking (Admin)
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            if (booking.status === 'Cancelled') return res.status(400).json({ message: 'Ya cancelada.' });
            booking.status = 'Cancelled';
            const updatedBooking = await booking.save();

            const io = req.app.get('socketio');
            if (io) io.emit('booking_update', updatedBooking);

            // ... log ...

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
