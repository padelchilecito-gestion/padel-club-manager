const express = require('express');
const router = express.Router();
const {
  createBookingCash,
  createBookingMercadoPago,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking
} = require('../controllers/bookingController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Rutas Públicas para que cualquiera pueda crear una reserva
router.post('/cash', createBookingCash);
router.post('/mercadopago', createBookingMercadoPago);

// A partir de aquí, se requiere estar autenticado
router.use(protect);

// Rutas para clientes, operadores y admins (el controlador filtra)
router.get('/', getBookings);
router.get('/:id', getBookingById);

// Rutas solo para operadores y admins
router.put('/:id', adminOrOperator, updateBooking);
router.delete('/:id', adminOrOperator, deleteBooking);

module.exports = router;
