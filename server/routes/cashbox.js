// server/routes/cashbox.js
const express = require('express');
const router = express.Router();
const {
  startCashboxSession,
  closeCashboxSession,
  getActiveCashboxSession,
  addMovement,
  getActiveSessionReport,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const {
  validateCashboxStart,
  validateMovement,
} = require('../validators/cashboxValidator');

// Todas estas rutas requieren rol de Admin u Operador
router.use(protect);
router.use(adminOrOperator);

router.post('/start', validateCashboxStart, startCashboxSession);
router.post('/end', closeCashboxSession);
router.get('/session', getActiveCashboxSession);
router.post('/movement', validateMovement, addMovement);
router.get('/summary', getActiveSessionReport);

module.exports = router;
