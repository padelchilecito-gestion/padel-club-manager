const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/paymentController');

// @route   POST /api/payments/webhook
// @desc    Recibe notificaciones de Mercado Pago.
router.post('/webhook', handleWebhook);

module.exports = router;
