const express = require('express');
const router = express.Router();
const {
  getCourts,
  createCourt,
  getCourtById,
  updateCourt,
  deleteCourt,
  // getPublicCourts, // <-- ELIMINADO (Causaba el error)
  // getAvailabilityForPublic, // <-- ELIMINADO (Ruta vieja)
  getAggregatedAvailability // Esta es la única función de disponibilidad que necesitamos
} = require('../controllers/courtController');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- RUTA DE DISPONIBILIDAD NUEVA Y ÚNICA ---
// GET /api/courts/availability/:date
// Obtiene la disponibilidad agregada para una fecha (para el TimeSlotFinder)
router.get('/availability/:date', getAggregatedAvailability);

// --- Rutas de Admin (protegidas) ---
router.route('/')
  .get(protect, admin, getCourts)
  .post(protect, admin, createCourt);

router
  .route('/:id')
  .get(protect, admin, getCourtById)
  .put(protect, admin, updateCourt)
  .delete(protect, admin, deleteCourt);

// --- RUTAS PÚBLICAS ANTIGUAS (ELIMINADAS) ---
// router.get('/public', getPublicCourts); // <-- Causa del error
// router.get('/availability/:date/:courtId', getAvailabilityForPublic); // <-- Ruta vieja

module.exports = router;
