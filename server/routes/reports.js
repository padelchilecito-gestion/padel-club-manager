// server/routes/reports.js (CORREGIDO Y VERIFICADO)
const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getRevenueLast30Days,
  getTopSellingProducts,
  getCourtOccupancy,
} = require('../controllers/reportController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.get('/dashboard', protect, adminOrOperator, getDashboardData);
router.get('/revenue-last-30-days', protect, adminOrOperator, getRevenueLast30Days);
router.get('/top-selling-products', protect, adminOrOperator, getTopSellingProducts);
router.get('/court-occupancy', protect, adminOrOperator, getCourtOccupancy);

module.exports = router;
