const express = require('express');
const router = express.Router();
const { 
  createPaymentPreference, 
  receiveWebhook, 
  createBookingPreferenceQR // <-- 1. IMPORTAR NUEVA FUNCIÓN
} = require('../controllers/paymentController');
const { protect, admin } = require('../middlewares/authMiddleware'); // <-- 2. IMPORTAR MIDDLEWARE

// Ruta original para checkout web general
router.post('/create-preference', createPaymentPreference);

// --- 3. NUEVA RUTA para generar QR desde Preferencia ---
// @route   POST /api/payments/create-booking-preference-qr
// @desc    Create a MP Preference focused on QR for a specific booking
// @access  Private/Admin
router.post('/create-booking-preference-qr', protect, admin, createBookingPreferenceQR);
// --- FIN NUEVA RUTA ---

// Ruta para recibir webhooks
router.post('/webhook', receiveWebhook);

// --- RUTA ANTIGUA de QR (In-Store) ELIMINADA o COMENTADA ---
// router.post('/create-qr-order', protect, admin, createBookingQROrder); // Ya no se usa

module.exports = router;
