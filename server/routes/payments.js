const express = require('express');
const router = express.Router();
const { 
  // --- Importar las funciones que AHORA usamos ---
  createBookingQRDynamic,   // Nueva para QR real de Turnos
  receiveWebhookQR,         // Nuevo Webhook para QR real
  receiveWebhook,           // Webhook original para pagos web (si aplica)
  // createPaymentPreference, // Si tienes checkout web general
  // createSaleQRDynamic,     // Comentada - No la implementamos ahora
} = require('../controllers/paymentController');
const { protect, admin } = require('../middlewares/authMiddleware');

// ==========================================
// RUTAS PARA QR DINÁMICO REAL (API In-Store simplificada)
// ==========================================

// @route   POST /api/payments/create-booking-qr
// @desc    Genera QR dinámico para una reserva específica
// @access  Private/Admin
router.post('/create-booking-qr', protect, admin, createBookingQRDynamic);

// @route   POST /api/payments/webhook-qr
// @desc    Recibe notificaciones de QR dinámico (merchant_order)
// @access  Public (Mercado Pago)
router.post('/webhook-qr', receiveWebhookQR);


// ==========================================
// RUTAS PARA PAGOS WEB (PREFERENCIAS) - Si todavía las usas
// ==========================================

// @route   POST /api/payments/webhook
// @desc    Recibe notificaciones de preferencias web (payment)
// @access  Public (Mercado Pago)
router.post('/webhook', receiveWebhook);

// Si tienes un checkout web general que usa createPaymentPreference:
// router.post('/create-preference', createPaymentPreference);


// --- RUTAS ANTIGUAS (Comentadas o Eliminadas) ---
// router.post('/create-qr-order', protect, admin, /* función eliminada */); 
// router.post('/create-booking-preference-qr', protect, admin, /* función eliminada o renombrada */);

module.exports = router;
