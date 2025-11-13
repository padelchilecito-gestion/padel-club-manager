const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
  getPublicAvailabilitySlots,
  getPublicCourtOptions,
  // --- IMPORTAR NUEVAS FUNCIONES ---
  createRecurringBooking,
  deleteRecurringBooking,
  // ---------------------------------
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

// --- RUTAS PÚBLICAS ---
router.get('/public-slots', getPublicAvailabilitySlots);
router.get('/public-options', getPublicCourtOptions);

// --- RUTAS DE ADMIN/OPERADOR ---
router.post('/', protect, createBooking); // Crea una sola reserva
router.get('/availability', getBookingAvailability); // Legacy
router.get('/', protect, getBookings); // Obtiene reservas (paginadas)
router.put('/:id', protect, updateBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking); // Cancela una sola reserva

// --- NUEVAS RUTAS PARA RESERVAS FIJAS ---

// @route   POST /api/bookings/recurring
// @desc    Create a series of recurring (fixed) bookings
// @access  Operator/Admin
router.post('/recurring', protect, createRecurringBooking);

// @route   DELETE /api/bookings/recurring/:groupId
// @desc    Delete an entire series of recurring bookings
// @access  Operator/Admin
router.delete('/recurring/:groupId', protect, deleteRecurringBooking);

// ----------------------------------------

module.exports = router;
