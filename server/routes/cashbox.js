// server/routes/cashbox.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // --- CORRECCIÓN DE NOMBRES (a los originales) ---
  startSession,
  endSession,
  getSession,
  addMovement,
  getSummary,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const { 
  validateMovement, 
  handleValidationErrors 
} = require('../validators/cashboxValidator');


router.use(protect);
router.use(adminOrOperator);

// --- CORRECCIÓN DE NOMBRES ---
router.post('/start', startSession);
router.post('/end', endSession);
router.get('/session', getSession);
router.post('/movement', validateMovement, handleValidationErrors, addMovement);
router.get('/summary', getSummary);

module.exports = router;
