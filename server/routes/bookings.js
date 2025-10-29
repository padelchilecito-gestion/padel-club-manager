// server/routes/bookings.js

const express = require('express');
const router = express.Router();
const { 
  createBooking, // Tu función existente para crear reservas
  createBookingCash, // Nueva función para pago en efectivo
  createBookingMercadoPago, // Nueva función para Mercado Pago
  getBookings, 
  getBookingById, 
  updateBooking, 
  deleteBooking 
} = require('../controllers/bookingController');
const { protect, adminOrOperator, admin, authorize } = require('../middlewares/authMiddleware');

// Rutas públicas (no requieren autenticación)
router.post('/', createBooking); // Si tenías una ruta genérica de creación (revisar si entra en conflicto)
router.post('/cash', createBookingCash);
router.post('/mercadopago', createBookingMercadoPago);

// Rutas protegidas (requieren autenticación)
router.route('/')
  .get(protect, authorize(['Admin', 'Operator']), getBookings); 
router.route('/:id')
  .get(protect, getBookingById) 
  .put(protect, authorize(['Admin', 'Operator']), updateBooking)
  .delete(protect, authorize(['Admin', 'Operator']), deleteBooking);

module.exports = router;
