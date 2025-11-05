// server/routes/products.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // --- CORRECCIÓN DE NOMBRES ---
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsForShop,
  getProductForShop,
} = require('../controllers/productController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// --- CORRECCIÓN DE NOMBRES ---
router.get('/', getAllProducts);
router.get('/shop', getProductsForShop);
router.get('/:id', getProductById);
router.get('/shop/:id', getProductForShop);

router.post('/', protect, adminOrOperator, createProduct);
router.put('/:id', protect, adminOrOperator, updateProduct);
router.delete('/:id', protect, adminOrOperator, deleteProduct);

module.exports = router;
