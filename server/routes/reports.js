const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getRevenueLast30Days,
  getTopSellingProducts,
  getCourtOccupancy,
} = require('../controllers/reportController');
const { protect, admin } = require('../middlewares/authMiddleware');

// @route   GET api/reports/dashboard
// @desc    Get aggregated data for the main dashboard
// @access  Admin
router.get('/dashboard', protect, admin, getDashboardData);

// @route   GET api/reports/revenue-last-30-days
// @desc    Get daily revenue for the last 30 days
// @access  Admin
router.get('/revenue-last-30-days', protect, admin, getRevenueLast30Days);

// @route   GET api/reports/top-selling-products
// @desc    Get top 5 best-selling products
// @access  Admin
router.get('/top-selling-products', protect, admin, getTopSellingProducts);

// @route   GET api/reports/court-occupancy
// @desc    Get booking hours per court for a date range
// @access  Admin
router.get('/court-occupancy', protect, admin, getCourtOccupancy);


module.exports = router;