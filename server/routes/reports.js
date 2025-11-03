// server/routes/reports.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getRevenueLast30Days,
  getTopSellingProducts,
  getCourtOccupancy,
} = require('../controllers/reportController');

// --- INICIO DE LA CORRECCIÓN ---
// Importamos 'adminOrOperator' en lugar de 'authorize'
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// @route   GET api/reports/dashboard
// @desc    Get aggregated data for the main dashboard
// @access  Admin, Operator
// Reemplazamos 'authorize' por 'adminOrOperator'
router.get('/dashboard', protect, adminOrOperator, getDashboardData);

// @route   GET api/reports/revenue-last-30-days
// @desc    Get daily revenue for the last 30 days
// @access  Admin, Operator
// Reemplazamos 'authorize' por 'adminOrOperator'
router.get('/revenue-last-30-days', protect, adminOrOperator, getRevenueLast30Days);

// @route   GET api/reports/top-selling-products
// @desc    Get top 5 best-selling products
// @access  Admin, Operator
// Reemplazamos 'authorize' por 'adminOrOperator'
router.get('/top-selling-products', protect, adminOrOperator, getTopSellingProducts);

// @route   GET api/reports/court-occupancy
// @desc    Get booking hours per court for a date range
// @access  Admin, Operator
// Reemplazamos 'authorize' por 'adminOrOperator'
router.get('/court-occupancy', protect, adminOrOperator, getCourtOccupancy);
// --- FIN DE LA CORRECCIÓN ---

module.exports = router;
