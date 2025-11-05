// server/routes/sales.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSaleById,
  // Se usa el nombre exacto de tu controlador
  getSales,
  updateSaleStatus,
  deleteSale,
} = require('../controllers/saleController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(adminOrOperator); // Se usa el middleware correcto

router.route('/')
  .get(getSales) // Se usa el nombre de función correcto
  .post(createSale);

router.route('/:id')
  .get(getSaleById)
  .put(updateSaleStatus)
  .delete(deleteSale);

module.exports = router;
