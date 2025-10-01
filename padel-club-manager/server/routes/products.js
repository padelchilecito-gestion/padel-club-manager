const express = require('express');
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { protect, admin } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinary');

// @route   POST api/products
// @desc    Create a new product with image upload
// @access  Admin
router.post('/', protect, admin, upload.single('image'), createProduct);

// @route   GET api/products
// @desc    Get all products
// @access  Public (for the shop)
router.get('/', getAllProducts);

// @route   GET api/products/:id
// @desc    Get a single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   PUT api/products/:id
// @desc    Update a product with optional image upload
// @access  Admin
router.put('/:id', protect, admin, upload.single('image'), updateProduct);

// @route   DELETE api/products/:id
// @desc    Delete a product
// @access  Admin
router.delete('/:id', protect, admin, deleteProduct);

module.exports = router;