const express = require('express');
const router = express.Router();

// Import all route files
const userRoutes = require('./users');
const authRoutes = require('./auth');
const courtRoutes = require('./courts');
const bookingRoutes = require('./bookings');
const productRoutes = require('./products');
const saleRoutes = require('./sales');
const cashboxRoutes = require('./cashbox');
const paymentRoutes = require('./payments');
const reportRoutes = require('./reports');
const logRoutes = require('./logs');
const settingRoutes = require('./settings');
const availabilityRoutes = require('./availability');

console.log('[Routes] Index router loaded.');

// Mount all routes onto the main router
router.use('/availability', availabilityRoutes);
router.use('/users', userRoutes);
router.use('/auth', authRoutes);
router.use('/courts', courtRoutes);
router.use('/bookings', bookingRoutes);
router.use('/products', productRoutes);
router.use('/sales', saleRoutes);
router.use('/cashbox', cashboxRoutes);
router.use('/payments', paymentRoutes);
router.use('/reports', reportRoutes);
router.use('/logs', logRoutes);
router.use('/settings', settingRoutes);

module.exports = router;
