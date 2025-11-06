const express = require('express');
const router = express.Router();
const {
  getCourts,
  getCourtById,
  getAggregatedAvailability,
  createCourt,
  updateCourt,
  deleteCourt
} = require('../controllers/courtController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Rutas Públicas para clientes
router.get('/', getCourts);
router.get('/availability/:date', getAggregatedAvailability);
router.get('/:id', getCourtById);

// Rutas Privadas para administración de canchas
router.post('/', protect, adminOrOperator, createCourt);
router.put('/:id', protect, adminOrOperator, updateCourt);
router.delete('/:id', protect, adminOrOperator, deleteCourt);

module.exports = router;
