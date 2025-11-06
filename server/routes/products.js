const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductsForShop,
  getProductById,
  getProductForShop,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.get('/', getAllProducts);
router.get('/shop', getProductsForShop);
router.get('/:id', getProductById);
router.get('/shop/:id', getProductForShop);

router.post('/', protect, adminOrOperator, createProduct);
router.put('/:id', protect, adminOrOperator, updateProduct);
router.delete('/:id', protect, adminOrOperator, deleteProduct);

module.exports = router;
