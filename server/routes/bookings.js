// server/routes/bookings.js (CORREGIDO Y VERIFICADO)
const express = require('express');
const router = express.Router();
const {
  createBooking,
  createBookingCash,
  createBookingMercadoPago,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.post('/cash', createBookingCash);
router.post('/mercadopago', createBookingMercadoPago);

router.route('/')
  .get(protect, adminOrOperator, getBookings)
  .post(protect, createBooking);

router.route('/mybookings')
  .get(protect, getBookings);

router.route('/:id')
  .get(protect, getBookingById)
  .put(protect, adminOrOperator, updateBooking)
  .delete(protect, adminOrOperator, deleteBooking);

module.exports = router;
