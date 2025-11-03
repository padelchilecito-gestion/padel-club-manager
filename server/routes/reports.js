const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getRevenueLast30Days,
  getTopSellingProducts,
  getCourtOccupancy,
} = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/authMiddleware');

// @route   GET api/reports/dashboard
// @desc    Get aggregated data for the main dashboard
// @access  Admin, Operator
router.get('/dashboard', protect, authorize(['Admin', 'Operator']), getDashboardData);

// @route   GET api/reports/revenue-last-30-days
// @desc    Get daily revenue for the last 30 days
// @access  Admin, Operator
router.get('/revenue-last-30-days', protect, authorize(['Admin', 'Operator']), getRevenueLast30Days);

// @route   GET api/reports/top-selling-products
// @desc    Get top 5 best-selling products
// @access  Admin, Operator
router.get('/top-selling-products', protect, authorize(['Admin', 'Operator']), getTopSellingProducts);

// @route   GET api/reports/court-occupancy
// @desc    Get booking hours per court for a date range
// @access  Admin, Operator
router.get('/court-occupancy', protect, authorize(['Admin', 'Operator']), getCourtOccupancy);


module.exports = router;