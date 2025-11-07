const Booking = require('../models/Booking');
const Court = require('../models/Court');
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
        const booking = await Booking.findById(req.params.id);
        if (booking) {
            booking.status = 'Cancelled';
            const updatedBooking = await booking.save();

            const io = req.app.get('socketio');
            io.emit('booking_update', updatedBooking); // Usamos 'update' para que se vea el cambio a cancelado
            
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


module.exports = {
  createBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
};