// server/routes/payments.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createMercadoPagoPreference,
  handleMercadoPagoWebhook,
  getPaymentStatus,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Webhook de Mercado Pago (es público)
router.post('/webhook', handleMercadoPagoWebhook);

// Rutas protegidas
router.post('/create-preference', protect, createMercadoPagoPreference);
router.get('/status/:id', protect, getPaymentStatus);

module.exports = router;
