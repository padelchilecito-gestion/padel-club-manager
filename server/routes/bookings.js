// server/routes/bookings.js (CORREGIDO)
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
const { protect, admin, adminOrOperator } = require('../middlewares/authMiddleware');

// --- Rutas Públicas ---
router.post('/cash', createBookingCash);
router.post('/mercadopago', createBookingMercadoPago);

// --- Rutas Protegidas ---
router.route('/')
  .get(protect, adminOrOperator, getBookings)
  .post(protect, createBooking);

// Ruta para que un cliente vea sus propias reservas
router.route('/mybookings')
  .get(protect, getBookings);

router.route('/:id')
  .get(protect, getBookingById)
  .put(protect, adminOrOperator, updateBooking)
  .delete(protect, adminOrOperator, deleteBooking);

module.exports = router;
