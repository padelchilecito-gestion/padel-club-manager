// server/routes/cashbox.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const cashboxController = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const { validateMovement } = require('../validators/cashboxValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

router.use(protect);
router.use(adminOrOperator);

router.post('/start', cashboxController.startCashboxSession);
router.post('/close', cashboxController.closeCashboxSession);
router.get('/current', cashboxController.getActiveCashboxSession);
router.get('/report', cashboxController.getActiveSessionReport);

router.post(
  '/movement',
  validateMovement,
  handleValidationErrors,
  cashboxController.addMovement
);

module.exports = router;
