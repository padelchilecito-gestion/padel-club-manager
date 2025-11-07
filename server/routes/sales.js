// server/routes/sales.js (CORREGIDO Y VERIFICADO)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
} = require('../controllers/saleController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(adminOrOperator);

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:id')
  .get(getSaleById)
  .put(updateSale)
  .delete(deleteSale);

module.exports = router;
