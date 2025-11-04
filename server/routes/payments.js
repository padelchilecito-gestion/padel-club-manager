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

// For bookings (web button and QR) - accessible by any logged-in user
router.post('/create-booking-preference', protect, createBookingPreference);
router.post('/create-booking-qr', protect, createBookingQRDynamic);

// For POS sales - accessible only by admin or operators
router.post(
  '/create-pos-preference',
  protect,
  adminOrOperator,
  createPosPreference
);

// Webhooks - public routes to receive notifications from Mercado Pago
router.post('/webhook', receiveWebhook);
router.post('/webhook-qr', receiveWebhookQR);

module.exports = router;
