// server/routes/index.js - CORREGIDO
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
// CORRECCIÓN: Se quita el prefijo '/api' de todas las rutas.
// server.js ya se encarga de añadirlo globalmente.
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
// router.use('/debug', debugRoutes);

// Ruta para verificar la versión (útil para health checks)
// Esta ruta ahora será /api/version
router.get('/version', (req, res) => {
  res.json({ version: process.env.npm_package_version || '1.0.0' });
});

// ... (El resto del archivo que sirve el frontend)

module.exports = router;
