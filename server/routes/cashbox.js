// server/routes/cashbox.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  startCashboxSession,
  closeCashboxSession,
  getActiveCashboxSession,
  getActiveSessionReport,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const { validateCashboxStart } = require('../validators/cashboxValidator');

// Todas estas rutas requieren rol de Admin u Operador
router.use(protect);
router.use(adminOrOperator);

router.post('/start', validateCashboxStart, startCashboxSession);
router.post('/end', closeCashboxSession);
router.get('/session', getActiveCashboxSession);
router.get('/summary', getActiveSessionReport);
// The /movement route was removed because the addMovement controller function does not exist.

module.exports = router;
