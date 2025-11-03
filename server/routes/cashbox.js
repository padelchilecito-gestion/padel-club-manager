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

// --- INICIO DE LA CORRECCIÓN ---
// Importamos AMBAS funciones del validador
const { 
  validateMovement, 
  handleValidationErrors 
} = require('../validators/cashboxValidator');
// --- FIN DE LA CORRECCIÓN ---


// Todas estas rutas requieren rol de Admin u Operador
router.use(protect);
router.use(adminOrOperator);

router.post('/start', startSession);
router.post('/end', endSession);
router.get('/session', getSession);

// --- INICIO DE LA CORRECCIÓN ---
// Añadimos 'handleValidationErrors' después de las reglas de 'validateMovement'
router.post('/movement', validateMovement, handleValidationErrors, addMovement);
// --- FIN DE LA CORRECCIÓN ---

router.get('/summary', getSummary);

module.exports = router;
