// server/routes/cashbox.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession,
  getSession,
  addMovement,
  getSummary,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const { validateMovement } = require('../validators/cashboxValidator');

// Todas estas rutas requieren rol de Admin u Operador
router.use(protect);
router.use(adminOrOperator); // <-- CORREGIDO

router.post('/start', startSession);
router.post('/end', endSession);
router.get('/session', getSession);
router.post('/movement', validateMovement, addMovement);
router.get('/summary', getSummary);

module.exports = router;
