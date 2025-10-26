const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
// --- CORRECCIÓN DE IMPORTACIÓN ---
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
    const slotDuration = 30; // TODO: Usar settings.slotDuration
    const endTime = dateFnsTz.addMinutes(
      dateFnsTz.zonedTimeToUtc(`${lastSlot.date}T${lastSlot.startTime}`, timeZone),
      slotDuration
    );
    // --- FIN DE CORRECCIÓN ---

    if (startTime >= endTime) return res.status(400).json({ message: 'La hora de fin debe ser posterior a la de inicio.' });

    const conflictingBooking = await Booking.findOne({
      court: firstSlot.courtId,
      status: { $ne: 'Cancelled' },
      $or: [
        { startTime: { $lt: endTime, $gte: startTime } },
        { endTime: { $gt: startTime, $lte: endTime } },
        { startTime: { $lte: startTime }, endTime: { $gte: endTime } }
      ],
    });
    if (conflictingBooking) return res.status(409).json({ message: 'Uno o más de los turnos seleccionados ya fueron reservados.' });

    const totalPrice = slots.reduce((total, slot) => total + slot.price, 0);
    const booking = new Booking({
      court: firstSlot.courtId, user: { name: user.name, lastName: user.lastName, phone: user.phone },
      startTime, endTime, price: totalPrice, paymentMethod,
      isPaid: paymentMethod === 'MercadoPago', status: 'Confirmed',
    });
    const createdBooking = await booking.save();

    req.app.get('socketio').emit('booking_update', createdBooking);

    if (createdBooking.user.phone) {
        const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva en Padel Club Manager para la cancha "${court.name}" el ${startTime.toLocaleString(timeZone)} ha sido confirmada. Total: $${totalPrice}. ¡Te esperamos!`;
        // await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error('Error en createBooking:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

/* --- CÓDIGO ORIGINAL (con corrección de uso) --- */
const getBookingAvailability = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) return res.status(400).json({ message: 'La fecha es requerida' });
        const timeZone = 'America/Argentina/Buenos_Aires';
        // --- CORRECCIÓN DE USO ---
        const start = dateFnsTz.startOfDay(date, { timeZone });
        const end = dateFnsTz.endOfDay(date, { timeZone });
        // --- FIN DE CORRECCIÓN ---
        const bookings = await Booking.find({
            startTime: { $gte: start, $lt: end }, status: { $ne: 'Cancelled' }
        }).populate('court');
        res.status(200).json(bookings);
    } catch (error) {
        console.error("Error en getBookingAvailability:", error);
        res.status(500).json({ message: 'Error interno al obtener disponibilidad.', error: error.message });
    }
};

// @desc    Get all bookings
const getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({}).populate('court', 'name courtType').sort({ startTime: -1 });
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single booking by ID
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('court');
    if (booking) {
      res.json(booking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      booking.status = req.body.status || booking.status;
      booking.isPaid = req.body.isPaid !== undefined ? req.body.isPaid : booking.isPaid;

      const updatedBooking = await booking.save();

      const io = req.app.get('socketio');
      io.emit('booking_update', updatedBooking);

      // const logDetails = `Booking ID ${updatedBooking._id} status changed...`;
      // await logActivity(req.user, 'BOOKING_UPDATED', logDetails);

      res.json(updatedBooking);
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Cancel a booking
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.status = 'Cancelled';
            const updatedBooking = await booking.save();

            const io = req.app.get('socketio');
            io.emit('booking_deleted', { id: req.params.id });

            // const logDetails = `Booking ID ${updatedBooking._id} was cancelled.`;
            // await logActivity(req.user, 'BOOKING_CANCELLED', logDetails);

            res.json({ message: 'Booking cancelled successfully' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error(error);
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
