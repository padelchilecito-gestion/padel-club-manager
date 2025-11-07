const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/', protect, createBooking);
router.get('/availability', getBookingAvailability);
router.get('/', protect, getBookings);
router.put('/:id', protect, updateBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;