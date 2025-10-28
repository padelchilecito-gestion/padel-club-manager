// server/routes/payments.js - RUTAS CORREGIDAS
const express = require('express');
const router = express.Router();
const { 
  createBookingPreference,   // Botón web
  createBookingQRDynamic,    // QR turnos
  receiveWebhook,            // Webhook web
  receiveWebhookQR           // Webhook QR
} = require('../controllers/paymentController');
const { protect, admin } = require('../middlewares/authMiddleware');

// ==========================================
// BOTÓN WEB - CHECKOUT PRO
// ==========================================
// @route   POST /api/payments/create-preference
// @desc    Crea preferencia para botón web que abre Mercado Pago
// @access  Private/Admin
router.post('/create-preference', protect, admin, createBookingPreference);

// ==========================================
// QR DINÁMICO - TURNOS Y POS
// ==========================================
// @route   POST /api/payments/create-booking-qr
// @desc    Genera QR dinámico para cobrar en persona
// @access  Private/Admin
router.post('/create-booking-qr', protect, admin, createBookingQRDynamic);

// ==========================================
// WEBHOOKS
// ==========================================
// @route   POST /api/payments/webhook
// @desc    Recibe notificaciones de pagos web (payment)
// @access  Public (Mercado Pago)
router.post('/webhook', receiveWebhook);

// @route   POST /api/payments/webhook-qr
// @desc    Recibe notificaciones de QR (merchant_order)
// @access  Public (Mercado Pago)
router.post('/webhook-qr', receiveWebhookQR);

module.exports = router;
