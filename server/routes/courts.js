const express = require('express');
const router = express.Router();
const {
  getCourts,
  createCourt,
  getCourtById,
  updateCourt,
  deleteCourt,
  getPublicCourts,
  getAvailabilityForPublic,
  getAggregatedAvailability // Importar la nueva función
} = require('../controllers/courtController');
const { protect, admin } = require('../middlewares/authMiddleware');

// --- NUEVA RUTA (Punto 1) ---
// GET /api/courts/availability/:date
// Obtiene la disponibilidad agregada para una fecha, sin especificar cancha
router.get('/availability/:date', getAggregatedAvailability);

// --- Rutas existentes ---
router.route('/').get(protect, admin, getCourts).post(protect, admin, createCourt);
router.get('/public', getPublicCourts);
router.get('/availability/:date/:courtId', getAvailabilityForPublic); // Ruta vieja
router
  .route('/:id')
  .get(protect, admin, getCourtById)
  .put(protect, admin, updateCourt)
  .delete(protect, admin, deleteCourt);

module.exports = router;
