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

// --- CORRECCIÓN 1: Importar el middleware correcto ---
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// --- CORRECCIÓN 2: Importar AMBOS manejadores de validación ---
const { 
  validateMovement, 
  handleValidationErrors 
} = require('../validators/cashboxValidator');


// Aplicar middlewares para todas las rutas
router.use(protect);
router.use(adminOrOperator); // <-- CORREGIDO: Se usa 'adminOrOperator'

// Rutas
router.post('/start', startSession);

// --- CORRECCIÓN 3: Usar la función correcta 'endSession' ---
router.post('/end', endSession); // <-- CORREGIDO: Se usa 'endSession' en lugar de 'closeSession'

router.get('/session', getSession);

// --- CORRECCIÓN 2 (Continuación): Usar el manejador de validación ---
router.post('/movement', validateMovement, handleValidationErrors, addMovement);

router.get('/summary', getSummary);

module.exports = router;
