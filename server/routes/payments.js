const express = require('express');
const router = express.Router();
const {
  createPaymentPreference,
  receiveWebhook,
} = require('../controllers/paymentController');

// @route   POST api/payments/create-preference
// @desc    Create a Mercado Pago payment preference
// @access  Public / Operator
router.post('/create-preference', createPaymentPreference);

// @route   POST api/payments/webhook
// @desc    Receive Mercado Pago webhook notifications
// @access  Public (from Mercado Pago)
router.post('/webhook', receiveWebhook);

module.exports = router;