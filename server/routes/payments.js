// server/routes/payments.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/create-booking-preference', protect, paymentController.createBookingPreference);
router.post('/create-booking-qr', protect, paymentController.createBookingQRDynamic);
router.post('/create-pos-preference', protect, paymentController.createPosPreference);

router.post('/webhook', paymentController.receiveWebhook);
router.post('/webhook-qr', paymentController.receiveWebhookQR);

module.exports = router;
