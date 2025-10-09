const Booking = require('../models/Booking');
const Court = require('../models/Court');
const Setting = require('../models/Setting');
const { isBefore, subHours, startOfDay, endOfDay } = require('date-fns');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public or Admin
const createBooking = async (req, res) => {
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
    
    // Si el precio no viene (desde el admin), se calcula.
    let finalPrice = price;
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
    });

    const createdBooking = await booking.save();
    
    const io = req.app.get('socketio');
    io.emit('booking_update', createdBooking);
    
    const logDetails = `Booking created for ${createdBooking.user.name} on court '${court.name}' from ${start.toLocaleString()} to ${end.toLocaleString()}.`;
    await logActivity(req.user, 'BOOKING_CREATED', logDetails);

    if (createdBooking.user.phone) {
        const messageBody = `¡Hola ${createdBooking.user.name}! Tu reserva ha sido confirmada para la cancha "${court.name}" el ${start.toLocaleString()}. ¡Te esperamos!`;
        await sendWhatsAppMessage(createdBooking.user.phone, messageBody);
    }

    res.status(201).json(createdBooking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const getAllBookingsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, courtId, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (courtId) query.court = courtId;

    if (date) {
      const selectedDate = new Date(date);
      query.startTime = {
        $gte: startOfDay(selectedDate),
        $lte: endOfDay(selectedDate)
      };
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      populate: 'court',
      sort: { startTime: -1 },
    };

    const bookings = await Booking.paginate(query, options);
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
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
        const [year, month, day] = date.split('T')[0].split('-').map(Number);
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

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
    // NOTA: Se añade un filtro para no mostrar los turnos cancelados de hace más de 2 días.
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const bookings = await Booking.find({
      $or: [
        { status: { $ne: 'Cancelled' } },
        { status: 'Cancelled', updatedAt: { $gte: twoDaysAgo } }
      ]
    }).populate('court', 'name courtType').sort({ startTime: -1 });

    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a booking completely
// @route   PUT /api/bookings/:id
// @access  Operator/Admin
const updateBooking = async (req, res) => {
  try {
    const { courtId, user, startTime, endTime, price, status, isPaid, paymentMethod } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.court = courtId || booking.court;
    booking.user = user || booking.user;
    booking.startTime = startTime || booking.startTime;
    booking.endTime = endTime || booking.endTime;
    booking.price = price !== undefined ? price : booking.price;
    booking.status = status || booking.status;
    booking.isPaid = isPaid !== undefined ? isPaid : booking.isPaid;
    booking.paymentMethod = paymentMethod || booking.paymentMethod;

    const updatedBooking = await booking.save();

    const io = req.app.get('socketio');
    io.emit('booking_update', updatedBooking);

    const logDetails = `Booking ID ${updatedBooking._id} was updated.`;
    await logActivity(req.user, 'BOOKING_UPDATED', logDetails);

    res.json(updatedBooking);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


// @desc    Update booking status and payment
// @route   PUT /api/bookings/:id/status
// @access  Operator/Admin
const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (booking) {
      booking.status = req.body.status || booking.status;
      booking.isPaid = req.body.isPaid !== undefined ? req.body.isPaid : booking.isPaid;
      // NOTA: Se actualiza también el método de pago si se envía.
      booking.paymentMethod = req.body.paymentMethod || booking.paymentMethod;
      
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
    const { id } = req.params;
    const userId = req.user._id;

    const booking = await Booking.findById(id).populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada.' });
    }

    const isOwner = booking.user && booking.user._id.toString() === userId.toString();
    const isAdminOrOperator = req.user.role === 'Admin' || req.user.role === 'Operator';

    if (!isOwner && !isAdminOrOperator) {
      return res.status(403).json({ message: 'No tienes permiso para cancelar esta reserva.' });
    }

    if (new Date(booking.startTime) < new Date()) {
      return res.status(400).json({ message: 'No se puede cancelar una reserva que ya ha pasado.' });
    }

    const policyHoursSetting = await Setting.findOne({ key: 'CANCELLATION_POLICY_HOURS' });
    const penaltyPercentageSetting = await Setting.findOne({ key: 'CANCELLATION_PENALTY_PERCENTAGE' });

    const cancellationHours = parseInt(policyHoursSetting?.value || '24', 10);
    const penaltyPercentage = parseInt(penaltyPercentageSetting?.value || '0', 10);

    const cancellationDeadline = subHours(new Date(booking.startTime), cancellationHours);
    let finalPenalty = 0;

    if (isBefore(new Date(), cancellationDeadline) || isAdminOrOperator) {
        booking.status = 'Cancelled';
        booking.cancellationReason = req.body.reason || 'Cancelación sin penalización.';
    } else {
        booking.status = 'Cancelled with Penalty';
        finalPenalty = (booking.price * penaltyPercentage) / 100;
        booking.penaltyAmount = finalPenalty;
        booking.cancellationReason = req.body.reason || `Cancelación fuera de plazo. Penalización: $${finalPenalty}.`;
    }

    const updatedBooking = await booking.save();
    const logDetails = `Booking ID ${updatedBooking._id} cancelled. Status: ${updatedBooking.status}. Penalty: ${finalPenalty}.`;
    await logActivity(req.user, 'BOOKING_CANCELLED', logDetails);

    res.json(updatedBooking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  createBooking,
  getBookings,
  getAllBookingsAdmin,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
};