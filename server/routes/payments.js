// server/routes/payments.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createMercadoPagoPreference,
  handleMercadoPagoWebhook,
  getPaymentStatus,
  createPosPreference, // <-- 1. Importar la nueva función
} = require('../controllers/paymentController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware'); // <-- 2. Importar middlewares

// Webhook de Mercado Pago (es público)
router.post('/webhook', handleMercadoPagoWebhook);

// Ruta para reservas (protegida por login)
router.post('/create-preference', protect, createMercadoPagoPreference);

// --- INICIO DE LA CORRECCIÓN ---
// 3. Añadir la nueva ruta para el POS (protegida por Admin/Operador)
router.post('/create-pos-preference', protect, adminOrOperator, createPosPreference);
// --- FIN DE LA CORRECCIÓN ---

router.get('/status/:id', protect, getPaymentStatus);

module.exports = router;
