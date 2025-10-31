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
// const debugRoutes = require('../debug/routes.js'); // Descomentar si es necesario

const router = express.Router();

console.log('[Routes] Index router loaded.');

// API routes
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/courts', courtRoutes);
router.use('/api/bookings', bookingRoutes);
router.use('/api/products', productRoutes);
router.use('/api/sales', saleRoutes);
router.use('/api/reports', reportRoutes);
router.use('/api/settings', settingRoutes);
router.use('/api/logs', logRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/api/cashbox', cashboxRoutes);
// router.use('/api/debug', debugRoutes);

// Ruta para verificar la versión (útil para health checks)
router.get('/api/version', (req, res) => {
  res.json({ version: process.env.npm_package_version || '1.0.0' });
});

// ... (El resto del archivo que sirve el frontend)

module.exports = router;
