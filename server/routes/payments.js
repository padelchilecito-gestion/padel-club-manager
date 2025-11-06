// server/routes/payments.js (VERSIÓN UNIFICADA FINAL)
const express = require('express');
const router = express.Router();
const {
  createQrPayment,
  handleWebhook,
  getPaymentStatus
} = require('../controllers/paymentController'); // <-- Importa las funciones correctas
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Ruta UNIFICADA para crear QR (para POS y Reservas)
router.post('/create-qr', protect, adminOrOperator, createQrPayment);

// Ruta pública para recibir notificaciones de Mercado Pago
router.post('/webhook', handleWebhook);

// Ruta para verificar el estado de un pago
router.get('/status/:paymentId', protect, getPaymentStatus);

module.exports = router;