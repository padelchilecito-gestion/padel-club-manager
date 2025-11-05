// server/routes/courts.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // --- CORRECCIÓN DE NOMBRES (a los originales) ---
  getCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
} = require('../controllers/courtController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// --- CORRECCIÓN DE NOMBRES ---
router.get('/', getCourts);
router.get('/:id', getCourtById);

router.post('/', protect, adminOrOperator, createCourt);
router.put('/:id', protect, adminOrOperator, updateCourt);
router.delete('/:id', protect, adminOrOperator, deleteCourt);

module.exports = router;
