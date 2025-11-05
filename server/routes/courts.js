// server/routes/courts.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // Se usa el nombre exacto de tu controlador
  getCourts,
  getCourtById,
  createCourt,
  updateCourt,
  deleteCourt,
} = require('../controllers/courtController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Se usa el nombre de función correcto
router.get('/', getCourts);
router.get('/:id', getCourtById);

router.post('/', protect, adminOrOperator, createCourt);
router.put('/:id', protect, adminOrOperator, updateCourt);
router.delete('/:id', protect, adminOrOperator, deleteCourt);

module.exports = router;
