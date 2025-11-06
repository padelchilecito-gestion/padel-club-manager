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
const { validateMovement } = require('../validators/cashboxValidator');
const { handleValidationErrors } = require('../middlewares/validationMiddleware');

// Proteger todas las rutas de caja
router.use(protect);
router.use(adminOrOperator);

// Definición de rutas
router.post('/start', startCashboxSession);
router.post('/end', closeCashboxSession);
router.get('/session', getActiveCashboxSession);
router.get('/summary', getActiveSessionReport);

// Ruta con validación
router.post('/movement', validateMovement, handleValidationErrors, addMovement);

module.exports = router;
