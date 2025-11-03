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

// Importamos el middleware correcto
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Rutas públicas
router.get('/', getProducts);
router.get('/:id', getProductById);

// --- INICIO DE LA CORRECCIÓN ---
// Se elimina la línea 18 ("router.get('/shop/:id', getProductForShop);")
// porque la función 'getProductForShop' no existe en el controlador.
// --- FIN DE LA CORRECCIÓN ---

// Rutas protegidas (Admin u Operator)
router.post('/', protect, adminOrOperator, createProduct);
router.put('/:id', protect, adminOrOperator, updateProduct);
router.delete('/:id', protect, adminOrOperator, deleteProduct);

module.exports = router;
