// server/routes/cashbox.js (VERSIÓN FINAL Y CORRECTA)
const express = require('express');
const router = express.Router();
const {
  startSession,
  endSession, // <-- Se importa 'endSession'
  getSession,
  addMovement,
  getSummary,
} = require('../controllers/cashboxController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware'); // <-- Middleware correcto
const { 
  validateMovement, 
  handleValidationErrors // <-- Validador correcto
} = require('../validators/cashboxValidator');


// Aplicar middlewares para todas las rutas
router.use(protect);
router.use(adminOrOperator); // <-- Middleware correcto

// Rutas
router.post('/start', startSession);
router.post('/end', endSession); // <-- Ruta corregida
router.get('/session', getSession);
router.post('/movement', validateMovement, handleValidationErrors, addMovement); // <-- Ruta corregida
router.get('/summary', getSummary);

module.exports = router;
