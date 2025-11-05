// server/routes/products.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  // Se usan los nombres exactos de tu controlador
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsForShop,
  getProductForShop,
} = require('../controllers/productController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Se usan los nombres de función correctos
router.get('/', getProducts);
router.get('/shop', getProductsForShop);
router.get('/:id', getProductById);
router.get('/shop/:id', getProductForShop);

router.post('/', protect, adminOrOperator, createProduct);
router.put('/:id', protect, adminOrOperator, updateProduct);
router.delete('/:id', protect, adminOrOperator, deleteProduct);

module.exports = router;
