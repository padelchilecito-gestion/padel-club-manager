const express = require('express');
const router = express.Router();
const {
  createBooking,
  getBookings,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  getBookingAvailability,
  // --- IMPORTAMOS LAS NUEVAS FUNCIONES ---
  getPublicAvailabilitySlots,
  getPublicCourtOptions,
} = require('../controllers/bookingController');
const { protect } = require('../middlewares/authMiddleware');

// --- NUEVAS RUTAS PÚBLICAS ---

// @route   GET /api/bookings/public-slots
// @desc    Get all available 30-min slots for a given date
// @access  Public
router.get('/public-slots', getPublicAvailabilitySlots);

// @route   GET /api/bookings/public-options
// @desc    Get available courts and prices for a selected time range
// @access  Public
router.get('/public-options', getPublicCourtOptions);

// --- RUTAS EXISTENTES ---

router.post('/', protect, createBooking);
router.get('/availability', getBookingAvailability); // <- Esta la reemplazaremos en el front
router.get('/', protect, getBookings);
router.put('/:id', protect, updateBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id/cancel', protect, cancelBooking);

module.exports = router;
