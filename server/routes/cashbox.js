// server/routes/cashbox.js (CORRECTED & RESTORED)
const express = require('express');
const router = express.Router();
const {
  startCashboxSession,
  closeCashboxSession,
  getActiveCashboxSession,
  getActiveSessionReport,
  addMovement,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const { validateMovement } = require('../validators/cashboxValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

// All routes require Operator or Admin role
router.use(protect);
router.use(adminOrOperator);

router.post('/start', startCashboxSession);
router.post('/close', closeCashboxSession);
router.get('/current', getActiveCashboxSession);
router.get('/report', getActiveSessionReport);

// Route for adding a cash movement (income/expense)
router.post(
  '/movement',
  validateMovement,
  handleValidationErrors,
  addMovement
);

module.exports = router;
