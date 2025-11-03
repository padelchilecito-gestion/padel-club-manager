// server/routes/products.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductsForShop, // <-- Tu controlador sí tiene estas funciones
  getProductForShop,  // <-- Tu controlador sí tiene estas funciones
} = require('../controllers/productController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware'); // <-- CORREGIDO

// Rutas públicas
router.get('/', getProducts);
router.get('/shop', getProductsForShop); // <-- Ruta pública para la tienda
router.get('/:id', getProductById);
router.get('/shop/:id', getProductForShop); // <-- Ruta pública para la tienda

// Rutas protegidas (Admin u Operator)
router.post('/', protect, adminOrOperator, createProduct);
router.put('/:id', protect, adminOrOperator, updateProduct);
router.delete('/:id', protect, adminOrOperator, deleteProduct);

module.exports = router;
