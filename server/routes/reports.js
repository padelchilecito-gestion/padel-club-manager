const express = require('express');
const router = express.Router();
const {
  getDashboardData,
  getRevenueLast30Days,
  getTopSellingProducts,
  getCourtOccupancy
} = require('../controllers/reportController');
const { protect, admin } = require('../middlewares/authMiddleware');

// Proteger todas las rutas de reportes y requerir rol de Admin
router.use(protect);
router.use(admin);

router.get('/dashboard', getDashboardData);
router.get('/revenue-last-30-days', getRevenueLast30Days);
router.get('/top-selling-products', getTopSellingProducts);
router.get('/court-occupancy', getCourtOccupancy);

module.exports = router;
