// server/routes/index.js
const express = require('express');
const path = require('path');
const authRoutes = require('./auth.js');
const userRoutes = require('./users.js');
const courtRoutes = require('./courts.js');
const bookingRoutes = require('./bookings.js');
const productRoutes = require('./products.js');
const saleRoutes = require('./sales.js');
const reportRoutes = require('./reports.js');
const settingRoutes = require('./settings.js');
const logRoutes = require('./logs.js');
const paymentRoutes = require('./payments.js');
const cashboxRoutes = require('./cashbox.js');

const router = express.Router();

console.log('[Routes] Index router loaded.');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/courts', courtRoutes);
router.use('/bookings', bookingRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/reports', reportRoutes);
router.use('/settings', settingRoutes);
router.use('/logs', logRoutes);
router.use('/payments', paymentRoutes);
router.use('/cashbox', cashboxRoutes);

router.get('/version', (req, res) => {
  res.json({ version: process.env.npm_package_version || '1.0.0' });
});

module.exports = router;
