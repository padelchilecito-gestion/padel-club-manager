// server/routes/products.js
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOrOperator }_require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', getProducts);
router.get('/:id', getProductById);

// Rutas protegidas (Admin u Operator)
router.post('/', protect, adminOrOperator, createProduct);
router.put('/:id', protect, adminOrOperator, updateProduct);
router.delete('/:id', protect, adminOrOperator, deleteProduct);

module.exports = router;
