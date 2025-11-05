// server/routes/bookings.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { protect, admin, adminOrOperator } = require('../middlewares/authMiddleware');

router.post('/cash', bookingController.createBookingCash);
router.post('/mercadopago', bookingController.createBookingMercadoPago);

router.route('/')
  .get(protect, adminOrOperator, bookingController.getBookings)
  .post(protect, bookingController.createBooking);

router.route('/mybookings')
  .get(protect, bookingController.getBookings);

router.route('/:id')
  .get(protect, bookingController.getBookingById)
  .put(protect, adminOrOperator, bookingController.updateBooking)
  .delete(protect, adminOrOperator, bookingController.deleteBooking);

module.exports = router;
