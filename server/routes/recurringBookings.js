const express = require('express');
const router = express.Router();
const {
  createRecurringBooking,
  getRecurringBookings,
  toggleRecurringBooking,
  updateRecurringBooking,
  deleteRecurringBooking,
} = require('../controllers/recurringBookingController');
const { protect } = require('../middlewares/authMiddleware');

// @route   POST /api/recurring-bookings
// @desc    Create a recurring booking
// @access  Admin/Operator
router.post('/', protect, createRecurringBooking);

// @route   GET /api/recurring-bookings
// @desc    Get all recurring bookings
// @access  Admin/Operator
router.get('/', protect, getRecurringBookings);

// @route   PUT /api/recurring-bookings/:id/toggle
// @desc    Activate/Deactivate recurring booking
// @access  Admin/Operator
router.put('/:id/toggle', protect, toggleRecurringBooking);

// @route   PUT /api/recurring-bookings/:id
// @desc    Update recurring booking
// @access  Admin/Operator
router.put('/:id', protect, updateRecurringBooking);

// @route   DELETE /api/recurring-bookings/:id
// @desc    Delete recurring booking
// @access  Admin/Operator
router.delete('/:id', protect, deleteRecurringBooking);

module.exports = router;
