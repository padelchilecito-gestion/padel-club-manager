const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
  getAllBookingsAdmin,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middlewares/authMiddleware');

router.post('/', protect, createBooking);
router.get('/availability', getBookingAvailability);
router.get('/', protect, getBookings);
router.get('/admin', protect, authorize(['Admin', 'Operator']), getAllBookingsAdmin);
router.put('/:id', protect, updateBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;