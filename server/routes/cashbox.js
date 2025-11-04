// server/routes/cashbox.js
const express = require('express');
const router = express.Router();
const {
  getCashboxSession,
  startSession,
  closeSession,
  getSessionReport,
  addCashboxMovement,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const {
  validateCashboxStart,
  validateMovement,
} = require('../validators/cashboxValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

// All routes are protected and require Admin or Operator role
router.use(protect);
router.use(adminOrOperator);

router.post('/start', validateCashboxStart, handleValidationErrors, startSession);
router.post('/end', closeSession);
router.get('/session', getCashboxSession);
router.post('/movement', validateMovement, handleValidationErrors, addCashboxMovement);
router.get('/summary', getSessionReport);

module.exports = router;
