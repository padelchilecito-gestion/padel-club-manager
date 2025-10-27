const express = require('express');
const router = express.Router();
const { 
  createPaymentPreference, 
  receiveWebhook, 
  createBookingQROrder // <-- 1. IMPORTAR NUEVA FUNCIÓN
} = require('../controllers/paymentController');
const { protect, admin } = require('../middlewares/authMiddleware'); // <-- 2. IMPORTAR MIDDLEWARE

// @route   POST /api/payments/create-preference
// @desc    Create a Mercado Pago payment preference (Checkout Web)
// @access  Public / Operator
router.post('/create-preference', createPaymentPreference);

// --- 3. AÑADIR NUEVA RUTA PARA QR ---
// @route   POST /api/payments/create-qr-order
// @desc    Create a Mercado Pago QR Order for a specific booking
// @access  Private/Admin
router.post('/create-qr-order', protect, admin, createBookingQROrder);
// --- FIN NUEVA RUTA ---

// @route   POST /api/payments/webhook
// @desc    Receive Mercado Pago webhook notifications
// @access  Public
router.post('/webhook', receiveWebhook);

module.exports = router;
