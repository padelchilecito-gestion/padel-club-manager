// server/routes/cashbox.js - CON VALIDATOR COMENTADO TEMPORALMENTE
const express = require('express');
const router = express.Router();
const {
  getActiveCashboxSession,
  startCashboxSession,
  closeCashboxSession,
  getActiveSessionReport,
  // getCashboxHistory, // Asegúrate de importar si usas estas funciones
  // getSessionDetails
} = require('../controllers/cashboxController');
const { protect } = require('../middlewares/authMiddleware');

// --- INICIO DE CORRECCIÓN TEMPORAL ---
// Importar el validador (si existe)
// const { validateStartSession } = require('../validators/cashboxValidator'); 
// --- FIN DE CORRECCIÓN TEMPORAL ---


// Obtener sesión activa
router.get('/session/active', protect, getActiveCashboxSession);

// Iniciar sesión
// --- CORRECCIÓN TEMPORAL: Comentado 'validateStartSession' ---
router.post('/session/start', protect, /* validateStartSession, */ startCashboxSession);
// --- FIN DE CORRECCIÓN TEMPORAL ---


// Cerrar sesión
router.post('/session/close', protect, closeCashboxSession);

// Obtener reporte de sesión activa
router.get('/session/report', protect, getActiveSessionReport); // <-- Esta es la línea 24 (ahora 28)

// --- POTENCIALMENTE FALTAN ESTAS RUTAS! ---
// // Obtener historial de sesiones (Ejemplo)
// router.get('/history', protect, getCashboxHistory); 

// // Obtener detalles de una sesión específica (Ejemplo)
// router.get('/session/:id', protect, getSessionDetails);
// --- ---

module.exports = router;
