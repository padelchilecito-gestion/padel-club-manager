const express = require('express');
const router = express.Router();
const {
  createSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale
} = require('../controllers/saleController');
const { protect, admin, adminOrOperator } = require('../middlewares/authMiddleware');

// Proteger todas las rutas de ventas
router.use(protect);

// Rutas para Admin y Operadores
router.route('/')
  .post(adminOrOperator, createSale)
  .get(adminOrOperator, getSales);

router.route('/:id')
  .get(adminOrOperator, getSaleById);

// Rutas exclusivas para Admin
router.route('/:id')
  .put(admin, updateSale)
  .delete(admin, deleteSale);

module.exports = router;
