const express = require('express');
const router = express.Router();
const {
  createPosPreference,
  handleMercadoPagoWebhook,
  getPaymentStatus
} = require('../controllers/paymentController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Ruta para crear preferencia de pago desde el POS
router.post('/create-pos-preference', protect, adminOrOperator, createPosPreference);

// Ruta pública para recibir notificaciones de Mercado Pago
router.post('/webhook', handleMercadoPagoWebhook);

// Ruta para que un cliente o admin verifique el estado de un pago
router.get('/status/:paymentId', protect, getPaymentStatus);

module.exports = router;
