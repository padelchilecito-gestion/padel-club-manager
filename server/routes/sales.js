// server/routes/sales.js
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
} = require('../controllers/saleController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(adminOrOperator);

router.route('/')
  .get(getSales)
  .post(createSale);

// The routes for getSaleById, updateSaleStatus, and deleteSale have been removed
// because the corresponding controller functions do not exist.

module.exports = router;
