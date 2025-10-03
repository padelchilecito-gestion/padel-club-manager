const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
  const { courtId, user, startTime, endTime, paymentMethod, isPaid } = req.body;

  // --- LÓGICA PARA EL NÚMERO DE TELÉFONO ---
  let formattedPhone = user.phone.replace(/\s+/g, ''); // Limpiar espacios
  if (!formattedPhone.startsWith('54')) {
    if (formattedPhone.length === 10) { // Formato típico de Argentina sin +54
      formattedPhone = `549${formattedPhone}`;
    } else {
      formattedPhone = `54${formattedPhone}`;
    }
  }
  const sanitizedUser = { ...user, phone: formattedPhone };
  // --- FIN DE LA LÓGICA ---

  try {
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Validate booking times
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time.' });
    }

    // Check for conflicting bookings
    const conflictingBooking = await Booking.findOne({
      court: courtId,
      status: { $ne: 'Cancelled' }, // Don't conflict with cancelled bookings
      $or: [
        { startTime: { $lt: end, $gte: start } },
        { endTime: { $gt: start, $lte: end } },
        { startTime: { $lte: start }, endTime: { $gte: end } }
      ],
    });

    if (conflictingBooking) {
      return res.status(409).json({ message: 'The selected time slot is already booked.' });
    }
    
    // Calcula el precio para 30 minutos
    const durationHours = 0.5;
    const price = durationHours * court.pricePerHour;

    const booking = new Booking({
      court: courtId,
      user: sanitizedUser, // Usar el usuario con el teléfono formateado
      startTime: start,
      endTime: end,
      price,
      paymentMethod,
      isPaid: isPaid || false,
      status: 'Confirmed', // Or 'Pending' if payment is required
    });

    const createdBooking = await booking.save();
    
    // Emit real-time event
    const io = req.app.get('socketio');
    io.emit('booking_update', createdBooking);
    
    // Log the activity
    const logDetails = `Booking created for ${createdBooking.user.name} on court '${court.name}' from ${start.toLocaleString()} to ${end.toLocaleString()}.`;
    await logActivity(req.user, 'BOOKING_CREATED', logDetails); // req.user might be null if public

    // Send WhatsApp notification (placeholder)
    if (createdBooking.user.phone) {
        const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva en Padel Club Manager para la cancha "${court.name}" el ${start.toLocaleString()} ha sido confirmada. ¡Te esperamos!`;
        await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get availability for a court on a specific date
// @route   GET /api/bookings/availability
// @access  Public
const getBookingAvailability = async (req, res) => {
    const { courtId, date } = req.query;
    if (!courtId || !date) {
        return res.status(400).json({ message: 'Court ID and date are required.' });
    }

    try {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const bookings = await Booking.find({
            court: courtId,
            status: { $ne: 'Cancelled' },
            startTime: { $gte: startOfDay, $lte: endOfDay },
        }).select('startTime endTime');

        res.json(bookings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Operator/Admin
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
// @route   GET /api/bookings/:id
// @access  Operator/Admin
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
// @route   PUT /api/bookings/:id/status
// @access  Operator/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      booking.status = req.body.status || booking.status;
      booking.isPaid = req.body.isPaid !== undefined ? req.body.isPaid : booking.isPaid;
      
      const updatedBooking = await booking.save();
      
      const io = req.app.get('socketio');
      io.emit('booking_update', updatedBooking);
      
      const logDetails = `Booking ID ${updatedBooking._id} status changed to '${updatedBooking.status}'.`;
      await logActivity(req.user, 'BOOKING_UPDATED', logDetails);

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
// @route   PUT /api/bookings/:id/cancel
// @access  Operator/Admin
const cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.status = 'Cancelled';
            const updatedBooking = await booking.save();

            const io = req.app.get('socketio');
            io.emit('booking_deleted', { id: req.params.id });
            
            const logDetails = `Booking ID ${updatedBooking._id} was cancelled.`;
            await logActivity(req.user, 'BOOKING_CANCELLED', logDetails);

            res.json({ message: 'Booking cancelled successfully' });
        } else {
            res.status(404).json({ message: 'Booking not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get availability for all courts on a specific date
// @route   GET /api/bookings/availability-all
// @access  Public
const getAllCourtsAvailability = async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: 'Date is required.' });
    }

    try {
        const startOfDay = new Date(date);
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const activeCourts = await Court.find({ isActive: true }).select('_id name');
        const courtIds = activeCourts.map(c => c._id);

        const bookings = await Booking.find({
            court: { $in: courtIds },
            status: { $ne: 'Cancelled' },
            startTime: { $gte: startOfDay, $lte: endOfDay },
        }).select('court startTime endTime');

        res.json({
            courts: activeCourts,
            bookings: bookings,
        });
    } catch (error) {
        console.error('Error fetching all courts availability:', error);
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
  getAllCourtsAvailability,
};
