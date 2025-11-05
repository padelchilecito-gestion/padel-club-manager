// server/routes/reports.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.get('/dashboard', protect, adminOrOperator, reportController.getDashboardData);
router.get('/revenue-last-30-days', protect, adminOrOperator, reportController.getRevenueLast30Days);
router.get('/top-selling-products', protect, adminOrOperator, reportController.getTopSellingProducts);
router.get('/court-occupancy', protect, adminOrOperator, reportController.getCourtOccupancy);

module.exports = router;
