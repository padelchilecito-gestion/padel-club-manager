// server/routes/products.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

// --- INICIO DE LA CORRECCIÓN ---
// Importamos 'adminOrOperator' en lugar de 'authorize'
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');
// --- FIN DE LA CORRECCIÓN ---

// Rutas públicas
router.get('/', getProducts);
router.get('/:id', getProductById); // <- Esta era la línea 14 que daba error

// Rutas protegidas (Admin u Operator)
// Reemplazamos 'authorize' por 'adminOrOperator'
router.post('/', protect, adminOrOperator, createProduct);
router.put('/:id', protect, adminOrOperator, updateProduct);
router.delete('/:id', protect, adminOrOperator, deleteProduct);

module.exports = router;
