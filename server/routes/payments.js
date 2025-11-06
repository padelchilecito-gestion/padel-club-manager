const express = require('express');
const router = express.Router();
const {
  createBookingPreference,
  receiveWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/webhook', receiveWebhook);

router.post('/create-preference', protect, createBookingPreference);

module.exports = router;
