// server/routes/bookings.js (CORREGIDO)
const express = require('express');
const router = express.Router();

// Importamos las funciones que SÍ existen en tu controlador
const {
  createBooking,
  createBookingCash,
  createBookingMercadoPago,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require('../controllers/bookingController');

// Importamos los middlewares de seguridad que SÍ existen
const { protect, admin, adminOrOperator } = require('../middlewares/authMiddleware');

// --- Rutas Públicas ---
// (Cualquiera puede iniciar estos procesos de reserva)
router.post('/cash', createBookingCash);
router.post('/mercadopago', createBookingMercadoPago);

// --- Rutas Protegidas ---

// Ruta para '/api/bookings'
router.route('/')
  // Solo Admin y Operador pueden ver la lista completa de reservas
  .get(protect, adminOrOperator, getBookings)
  // Ruta genérica de creación (la que devuelve 501 "No implementada")
  .post(protect, createBooking);

// Ruta para '/api/bookings/mybookings'
// (para que un cliente vea sus propias reservas)
router.route('/mybookings')
  // Usamos getBookings. El controlador ya tiene la lógica
  // para filtrar por req.user.id si el rol es 'Client'.
  .get(protect, getBookings);

// Ruta para '/api/bookings/:id'
router.route('/:id')
  // Cualquier usuario logueado puede ver una reserva (el controlador verifica si es suya)
  .get(protect, getBookingById)
  // Solo Admin y Operador pueden actualizar una reserva
  .put(protect, adminOrOperator, updateBooking)
  // Solo Admin y Operador pueden eliminar una reserva
  .delete(protect, adminOrOperator, deleteBooking);

module.exports = router;
