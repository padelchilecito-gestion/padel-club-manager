// server/routes/sales.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
} = require('../controllers/saleController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Aplicamos middlewares
router.use(protect);
router.use(adminOrOperator);

router.route('/')
  .get(getSales)
  .post(createSale);

// The following routes were removed because their controller functions (getSaleById, updateSaleStatus, deleteSale) do not exist.

module.exports = router;
