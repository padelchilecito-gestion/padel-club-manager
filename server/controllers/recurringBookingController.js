const RecurringBooking = require('../models/RecurringBooking');
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { logActivity } = require('../utils/logActivity');
const { zonedTimeToUtc } = require('date-fns-tz');

const timeZone = 'America/Argentina/Buenos_Aires';

// Helper: Nombre del día
const getDayName = (dayIndex) => {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayIndex];
};

// @desc    Create a recurring booking
// @route   POST /api/recurring-bookings
// @access  Admin/Operator
const createRecurringBooking = async (req, res) => {
  const { courtId, user, dayOfWeek, startTime, duration, price, paymentMethod, isPaid, startDate, endDate, notes } = req.body;

  try {
    const court = await Court.findById(courtId);
    if (!court) {
      return res.status(404).json({ message: 'Court not found' });
    }

    // Verificar si ya existe una reserva recurrente para esta cancha/día/hora
    const existing = await RecurringBooking.findOne({
      court: courtId,
      dayOfWeek,
      startTime,
      isActive: true,
    });

    if (existing) {
      return res.status(409).json({ message: 'A recurring booking already exists for this court, day, and time.' });
    }

    const recurringBooking = new RecurringBooking({
      court: courtId,
      user,
      dayOfWeek,
      startTime,
      duration,
      price: price || (duration / 60) * court.pricePerHour,
      paymentMethod,
      isPaid: isPaid || false,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      notes,
      createdBy: req.user.id,
    });

    const created = await recurringBooking.save();

    await logActivity(req.user, 'BOOKING_CREATED', `Recurring booking created for ${user.name} on ${court.name} every ${getDayName(dayOfWeek)} at ${startTime}.`);

    res.status(201).json(created);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A recurring booking already exists for this slot.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all recurring bookings
// @route   GET /api/recurring-bookings
// @access  Admin/Operator
const getRecurringBookings = async (req, res) => {
  try {
    const bookings = await RecurringBooking.find({})
      .populate('court', 'name courtType')
      .populate('createdBy', 'username')
      .sort({ dayOfWeek: 1, startTime: 1 });
    
    res.json(bookings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Toggle recurring booking active status
// @route   PUT /api/recurring-bookings/:id/toggle
// @access  Admin/Operator
const toggleRecurringBooking = async (req, res) => {
  try {
    const booking = await RecurringBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Recurring booking not found' });
    }

    booking.isActive = !booking.isActive;
    await booking.save();

    const action = booking.isActive ? 'activated' : 'deactivated';
    await logActivity(req.user, 'BOOKING_UPDATED', `Recurring booking ${action} for ${booking.user.name}.`);

    res.json(booking);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update recurring booking
// @route   PUT /api/recurring-bookings/:id
// @access  Admin/Operator
const updateRecurringBooking = async (req, res) => {
  const { courtId, user, dayOfWeek, startTime, duration, price, paymentMethod, isPaid, endDate, notes } = req.body;

  try {
    const booking = await RecurringBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Recurring booking not found' });
    }

    if (courtId) booking.court = courtId;
    if (user) booking.user = user;
    if (dayOfWeek !== undefined) booking.dayOfWeek = dayOfWeek;
    if (startTime) booking.startTime = startTime;
    if (duration) booking.duration = duration;
    if (price !== undefined) booking.price = price;
    if (paymentMethod) booking.paymentMethod = paymentMethod;
    if (isPaid !== undefined) booking.isPaid = isPaid;
    if (endDate !== undefined) booking.endDate = endDate ? new Date(endDate) : null;
    if (notes !== undefined) booking.notes = notes;

    const updated = await booking.save();

    await logActivity(req.user, 'BOOKING_UPDATED', `Recurring booking updated for ${updated.user.name}.`);

    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete recurring booking
// @route   DELETE /api/recurring-bookings/:id
// @access  Admin/Operator
const deleteRecurringBooking = async (req, res) => {
  try {
    const booking = await RecurringBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Recurring booking not found' });
    }

    await RecurringBooking.deleteOne({ _id: req.params.id });

    await logActivity(req.user, 'BOOKING_CANCELLED', `Recurring booking deleted for ${booking.user.name}.`);

    res.json({ message: 'Recurring booking deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};


module.exports = {
  createRecurringBooking,
  getRecurringBookings,
  toggleRecurringBooking,
  updateRecurringBooking,
  deleteRecurringBooking,
};
