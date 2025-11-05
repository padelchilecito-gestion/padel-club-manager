// server/routes/cashbox.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // Se usan los nombres exactos de tu controlador
  startSession,
  endSession,
  getSession,
  addMovement,
  getSummary,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
const { 
  validateMovement, 
  handleValidationErrors // Se importa el manejador de validación
} = require('../validators/cashboxValidator');


router.use(protect);
router.use(adminOrOperator); // Se usa el middleware correcto

// Se usan los nombres de función correctos
router.post('/start', startSession);
router.post('/end', endSession);
router.get('/session', getSession);
router.post('/movement', validateMovement, handleValidationErrors, addMovement); // Se añade el manejador
router.get('/summary', getSummary);

module.exports = router;
