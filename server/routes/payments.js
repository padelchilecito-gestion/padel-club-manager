// server/routes/payments.js
const express = require('express');
const router = express.Router();
const {
  createBookingPreference,
  createBookingQRDynamic,
  receiveWebhook,
  receiveWebhookQR,
  createPosPreference,
} = require('../controllers/paymentController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Para reservas (botón web y QR) - accesible por cualquier usuario logueado
router.post('/create-booking-preference', protect, createBookingPreference);
router.post('/create-booking-qr', protect, createBookingQRDynamic);

// Para ventas del POS - accesible solo por admin o operadores
router.post(
  '/create-pos-preference',
  protect,
  adminOrOperator,
  createPosPreference
);

// Webhooks - rutas públicas para recibir notificaciones de Mercado Pago
router.post('/webhook', receiveWebhook);
router.post('/webhook-qr', receiveWebhookQR);

module.exports = router;
