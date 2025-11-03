// server/routes/cashbox.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // --- CORRECCIÓN DE NOMBRES ---
  startCashboxSession,
  endCashboxSession,
  getActiveCashboxSession,
  addCashboxMovement,
  getCashboxSummary,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const { 
  validateMovement, 
  handleValidationErrors 
} = require('../validators/cashboxValidator');


router.use(protect);
router.use(adminOrOperator);

// --- CORRECCIÓN DE NOMBRES ---
router.post('/start', startCashboxSession);
router.post('/end', endCashboxSession);
router.get('/session', getActiveCashboxSession);
router.post('/movement', validateMovement, handleValidationErrors, addCashboxMovement);
router.get('/summary', getCashboxSummary);

module.exports = router;
