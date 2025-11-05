// server/routes/payments.js
const express = require('express');
const router = express.Router();
const {
  createBookingPreference,
  createBookingQRDynamic,
  receiveWebhook,
  receiveWebhookQR,
  createPosPreference
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

// Para reservas (botón web y QR)
router.post('/create-booking-preference', protect, createBookingPreference);
router.post('/create-booking-qr', protect, createBookingQRDynamic);

// Para ventas del POS
router.post('/create-pos-preference', protect, createPosPreference);

// Webhooks
router.post('/webhook', receiveWebhook);
router.post('/webhook-qr', receiveWebhookQR);

module.exports = router;
