// server/routes/products.js (CONSISTENT IMPORT FIX)
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

router.post('/', protect, adminOrOperator, productController.createProduct);
router.put('/:id', protect, adminOrOperator, productController.updateProduct);
router.delete('/:id', protect, adminOrOperator, productController.deleteProduct);

module.exports = router;
