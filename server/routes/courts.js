const express = require('express');
const router = express.Router();
const {
  createCourt,
  getCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
  getPublicCourts,
  getAvailabilityForPublic, // <-- Esta es la función que usamos
} = require('../controllers/courtController');
const { protect, admin } = require('../middlewares/authMiddleware');

// === RUTAS PÚBLICAS ===

// @desc    Get all active courts for public view
// @route   GET /api/courts/public
// @access  Public
router.get('/public', getPublicCourts);

// @desc    Get court availability for a specific date (Public)
// @route   GET /api/courts/availability/:date/:courtId
// @access  Public
// --- LÍNEA CORREGIDA ---
// Se añaden :date y :courtId para que coincida con la llamada del frontend
router.get('/availability/:date/:courtId', getAvailabilityForPublic);
// --- FIN DE CORRECCIÓN ---


// === RUTAS DE ADMIN ===

// @desc    Create a court
// @route   POST /api/courts
// @access  Admin
router.post('/', protect, admin, createCourt);

// @desc    Get all courts (admin view)
// @route   GET /api/courts
// @access  Admin
router.get('/', protect, admin, getCourts);

// @desc    Get court by ID
// @route   GET /api/courts/:id
// @access  Admin
router.get('/:id', protect, admin, getCourtById);

// @desc    Update a court
// @route   PUT /api/courts/:id
// @access  Admin
router.put('/:id', protect, admin, updateCourt);

// @desc    Delete a court
// @route   DELETE /api/courts/:id
// @access  Admin
router.delete('/:id', protect, admin, deleteCourt);

module.exports = router;
