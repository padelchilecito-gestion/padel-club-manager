// server/routes/sales.js (CORRECTED & RESTORED)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
} = require('../controllers/saleController');
const { protect, admin, adminOrOperator } = require('../middlewares/authMiddleware');

// Apply general protection and Operator access to all routes
router.use(protect);
router.use(adminOrOperator);

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:id')
  .get(getSaleById)
  .put(admin, updateSale)      // <-- Only Admin can update
  .delete(admin, deleteSale);  // <-- Only Admin can delete

module.exports = router;
