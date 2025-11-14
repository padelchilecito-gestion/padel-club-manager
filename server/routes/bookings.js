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
  // --- IMPORTAMOS LA NUEVA FUNCIÓN ---
  createPublicBooking, 
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

// --- NUEVA RUTA PÚBLICA (SOLUCIONA BUG 1 y 2) ---
// @route   POST /api/bookings/public
// @desc    Create a new booking from the public page
// @access  Public
router.post('/public', createPublicBooking);
// ---------------------------------------------

// --- RUTAS PÚBLICAS (GET) ---
router.get('/public-slots', getPublicAvailabilitySlots);
router.get('/public-options', getPublicCourtOptions);
router.get('/availability', getBookingAvailability); // Legacy

// --- RUTAS DE ADMIN (PROTEGIDAS) ---
// Esta ruta (POST /) ahora solo la usa el admin
router.post('/', protect, createBooking); 
router.get('/', protect, getBookings);
router.put('/:id', protect, updateBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
