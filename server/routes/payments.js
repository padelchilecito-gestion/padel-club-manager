const express = require('express');
const router = express.Router();
const { 
  createBookingQRDynamic, // <-- Función para QR de Turnos
  receiveWebhookQR,       // <-- Webhook para QR de Turnos
  receiveWebhook,         // <-- Webhook general (si aplica)
  // createPaymentPreference, // <-- Si tienes checkout web
} = require('../controllers/paymentController');
const { protect, admin } = require('../middlewares/authMiddleware');

// ==========================================
// RUTA PARA GENERAR QR DINÁMICO DE RESERVA
// ==========================================
// @route   POST /api/payments/create-booking-qr
// @desc    Genera QR dinámico para una reserva específica usando API simplificada
// @access  Private/Admin
router.post('/create-booking-qr', protect, admin, createBookingQRDynamic);


// ==========================================
// RUTA PARA WEBHOOK DE QR DINÁMICO (merchant_order)
// ==========================================
// @route   POST /api/payments/webhook-qr
// @desc    Recibe notificaciones de QR dinámico (merchant_order)
// @access  Public (Mercado Pago)
router.post('/webhook-qr', receiveWebhookQR);


// ==========================================
// RUTA PARA WEBHOOK GENERAL (payment) - Si aplica
// ==========================================
// @route   POST /api/payments/webhook
// @desc    Recibe notificaciones de pagos web (payment)
// @access  Public (Mercado Pago)
router.post('/webhook', receiveWebhook);


// --- OTRAS RUTAS (si las usas) ---
// router.post('/create-preference', createPaymentPreference); // Para checkout web

module.exports = router;
