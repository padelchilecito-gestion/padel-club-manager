// server/routes/sales.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const saleController = require('../controllers/saleController');
const { protect, admin, adminOrOperator } = require('../middlewares/authMiddleware');

router.use(protect);
router.use(adminOrOperator);

router.route('/')
  .get(saleController.getSales)
  .post(saleController.createSale);

router.route('/:id')
  .get(saleController.getSaleById)
  .put(admin, saleController.updateSale)
  .delete(admin, saleController.deleteSale);

module.exports = router;
