// server/routes/cashbox.js (CORREGIDO Y VERIFICADO)
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
  validateMovement,
} = require('../validators/cashboxValidator');
const {
  handleValidationErrors
} = require('../middlewares/validationMiddleware');

router.use(protect);
router.use(adminOrOperator);

router.post('/start', startCashboxSession);
router.post('/end', closeCashboxSession);
router.get('/session', getActiveCashboxSession);
router.post('/movement', validateMovement, handleValidationErrors, addMovement);
router.get('/summary', getActiveSessionReport);

module.exports = router;
