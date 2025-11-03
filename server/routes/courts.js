// server/routes/courts.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
} = require('../controllers/courtController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', getCourts);
router.get('/:id', getCourtById);

// Rutas protegidas (Admin u Operator)
router.post('/', protect, adminOrOperator, createCourt); // <-- CORREGIDO
router.put('/:id', protect, adminOrOperator, updateCourt); // <-- CORREGIDO
router.delete('/:id', protect, adminOrOperator, deleteCourt); // <-- CORREGIDO

module.exports = router;
