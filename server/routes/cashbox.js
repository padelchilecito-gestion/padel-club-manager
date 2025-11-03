// server/routes/cashbox.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession, // <-- CORREGIDO: Se importa 'endSession'
  getSession,
  addMovement,
  getSummary,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware'); // <-- CORREGIDO
const { 
  validateMovement, 
  handleValidationErrors // <-- CORREGIDO: Se importa el manejador
} = require('../validators/cashboxValidator');

// Aplicar middlewares para todas las rutas
router.use(protect);
router.use(adminOrOperator); // <-- CORREGIDO: Se usa 'adminOrOperator'

// Rutas
router.post('/start', startSession);

// --- CORRECCIÓN DE LÍNEA 27 ---
// La ruta era '/close' y usaba 'closeSession' que no existe
router.post('/end', endSession); // <-- CORREGIDO: Usa '/end' y 'endSession'

router.get('/session', getSession);

// --- CORRECCIÓN DE LÍNEA 17 ---
// Faltaba 'handleValidationErrors'
router.post('/movement', validateMovement, handleValidationErrors, addMovement);

router.get('/summary', getSummary);

module.exports = router;
