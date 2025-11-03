// server/routes/products.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController'); // <-- CORREGIDO: Se quitó getProductForShop
const { protect, adminOrOperator } = require('../middlewares/authMiddleware'); // <-- CORREGIDO

// Rutas públicas
router.get('/', getProducts);
router.get('/:id', getProductById);
// Se eliminaron las rutas '/shop' y '/shop/:id' que estaban rotas

// Rutas protegidas (Admin u Operator)
router.post('/', protect, adminOrOperator, createProduct); // <-- CORREGIDO
router.put('/:id', protect, adminOrOperator, updateProduct); // <-- CORREGIDO
router.delete('/:id', protect, adminOrOperator, deleteProduct); // <-- CORREGIDO

module.exports = router;
