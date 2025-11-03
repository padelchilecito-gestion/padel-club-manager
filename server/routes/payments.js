// server/routes/payments.js
const express = require('express');
const router = express.Router();
const {
  createBookingPreference,
  createBookingQRDynamic,
  receiveWebhook,
  receiveWebhookQR,
  createPosPreference // <-- AÑADIR ESTO
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Para reservas (botón web y QR)
router.post('/create-booking-preference', protect, createBookingPreference);
router.post('/create-booking-qr', protect, createBookingQRDynamic);

const { adminOrOperator } = require('../middlewares/authMiddleware');
// --- AÑADIR ESTA NUEVA RUTA ---
// Para ventas del POS
router.post('/create-pos-preference', protect, adminOrOperator, createPosPreference);
// ------------------------------

// Webhooks
router.post('/webhook', receiveWebhook);
router.post('/webhook-qr', receiveWebhookQR); // Mantenido por si acaso

module.exports = router;
