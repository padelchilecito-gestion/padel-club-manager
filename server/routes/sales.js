// server/routes/sales.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSaleById,
  // --- CORRECCIÓN DE NOMBRES ---
  getAllSales,
  updateSaleStatus,
  deleteSale,
} = require('../controllers/saleController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(adminOrOperator);

router.route('/')
  // --- CORRECCIÓN DE NOMBRES ---
  .get(getAllSales)
  .post(createSale);

router.route('/:id')
  .get(getSaleById)
  .put(updateSaleStatus)
  .delete(deleteSale);

module.exports = router;
