// server/routes/sales.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSaleById,
  getSales,
} = require('../controllers/saleController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware'); // <-- CORREGIDO

// Rutas protegidas (Admin u Operator)
router.use(protect);
router.use(adminOrOperator); // <-- CORREGIDO

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:id')
  .get(getSaleById);

module.exports = router;
