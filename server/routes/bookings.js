const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST api/bookings
// @desc    Create a new booking
// @access  Public
router.post('/', createBooking);

// @route   GET api/bookings/availability
// @desc    Get availability for a specific date
// @access  Public
router.get('/availability', getBookingAvailability);

// @route   GET api/bookings
// @desc    Get all bookings
// @access  Operator/Admin
router.get('/', protect, getBookings);

// @route   GET api/bookings/:id
// @desc    Get a single booking by ID
// @access  Operator/Admin
router.get('/:id', protect, getBookingById);

// @route   PUT api/bookings/:id/status
// @desc    Update booking status (confirm, etc.)
// @access  Operator/Admin
router.put('/:id/status', protect, updateBookingStatus);

// @route   PUT api/bookings/:id/cancel
// @desc    Cancel a booking
// @access  Operator/Admin
router.put('/:id/cancel', protect, cancelBooking);


module.exports = router;