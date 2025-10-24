const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { sendWhatsAppMessage } = require('../utils/notificationService');
const { logActivity } = require('../utils/logActivity');
const { zonedTimeToUtc } = require('date-fns-tz');
const { parseISO, startOfDay, endOfDay } = require('date-fns');

// @desc    Get availability for a specific date across all courts
// @route   GET /api/bookings/availability
// @access  Public
const getBookingAvailability = async (req, res) => {
    const { date } = req.query;
    if (!date) {
        return res.status(400).json({ message: 'Date is required' });
    }

    try {
        const timeZone = 'America/Argentina/Buenos_Aires';
        const startOfDayUTC = startOfDay(zonedTimeToUtc(date, timeZone));
        const endOfDayUTC = endOfDay(zonedTimeToUtc(date, timeZone));

        const courts = await Court.find({ status: 'available' });
        const bookings = await Booking.find({
            startTime: { $gte: startOfDayUTC, $lt: endOfDayUTC },
            status: { $ne: 'Cancelled' },
        });

        // Generate all possible slots for the day
        const openingTime = 9; // 9:00 AM
        const closingTime = 23; // 11:00 PM
        const slotDuration = 30; // 30 minutes
        const allSlots = [];
        for (let hour = openingTime; hour < closingTime; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                allSlots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
            }
        }

        const availability = allSlots.map(slotTime => {
            const slotStart = zonedTimeToUtc(`${date}T${slotTime}:00`, timeZone);

            const bookedCourtsForSlot = bookings.filter(b =>
                slotStart >= b.startTime && slotStart < b.endTime
            ).map(b => b.court.toString());

            const availableCourts = courts.length - bookedCourtsForSlot.length;

            return {
                startTime: slotTime,
                isAvailable: availableCourts > 0,
                availableCourtsCount: availableCourts,
            };
        });

        res.status(200).json(availability);
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ message: 'Server error' });
    }
};


// @desc    Create a new booking with multiple slots
// @route   POST /api/bookings
// @access  Public
const createBooking = async (req, res) => {
    const { date, slots, userName, userPhone, paymentMethod } = req.body;

    if (!date || !slots || !Array.isArray(slots) || slots.length === 0 || !userName || !userPhone) {
        return res.status(400).json({ message: 'Missing required fields.' });
    }

    try {
        const timeZone = 'America/Argentina/Buenos_Aires';

        // 1. Sort slots and create Date objects
        const sortedSlots = slots.sort();
        const startTimes = sortedSlots.map(slot => zonedTimeToUtc(`${date}T${slot}:00`, timeZone));
        const startTime = startTimes[0];
        const endTime = new Date(startTimes[startTimes.length - 1].getTime() + 30 * 60 * 1000); // Add 30 mins to the last slot

        // 2. Find an available court for the entire duration
        const courts = await Court.find({ status: 'available' });
        const conflictingBookings = await Booking.find({
            status: { $ne: 'Cancelled' },
            $or: [
                { startTime: { $lt: endTime, $gte: startTime } },
                { endTime: { $gt: startTime, $lte: endTime } },
            ],
        });

        const bookedCourtIds = conflictingBookings.map(b => b.court.toString());
        const availableCourt = courts.find(c => !bookedCourtIds.includes(c._id.toString()));

        if (!availableCourt) {
            return res.status(409).json({ message: 'No single court is available for the entire selected time range.' });
        }

        // 3. Calculate price and create booking
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        const totalPrice = durationHours * availableCourt.pricePerHour;

        const booking = new Booking({
            court: availableCourt._id,
            user: { name: userName, phone: userPhone },
            startTime,
            endTime,
            price: totalPrice,
            paymentMethod: paymentMethod || 'Efectivo',
            status: 'Confirmed', // Or 'Pending' if payment is required
        });

        const createdBooking = await booking.save();

        // 4. Emit socket event and log activity (optional but good practice)
        const io = req.app.get('socketio');
        if (io) {
            io.emit('booking_update', { ...createdBooking.toObject(), court: availableCourt });
        }

        // Log activity if a user is logged in
        if (req.user) {
            await logActivity(req.user, 'BOOKING_CREATED', `Booking for ${userName} on ${availableCourt.name}.`);
        }

        res.status(201).json(createdBooking);
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ message: 'Server error while creating booking.' });
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


module.exports = {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
};