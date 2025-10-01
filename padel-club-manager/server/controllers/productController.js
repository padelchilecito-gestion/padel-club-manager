const Product = require('../models/Product');
const { cloudinary } = require('../config/cloudinary');
const { logActivity } = require('../utils/logActivity');

// @desc    Create a new product
// @route   POST /api/products
// @access  Admin
const createProduct = async (req, res) => {
  const { name, category, price, stock, trackStockAlert, lowStockThreshold } = req.body;

  try {
    const product = new Product({
      name,
      category,
      price,
      stock,
      trackStockAlert,
      lowStockThreshold,
    });

    if (req.file) {
      product.imageUrl = req.file.path;
    }

    const createdProduct = await product.save();
    await logActivity(req.user, 'PRODUCT_CREATED', `Product '${createdProduct.name}' was created.`);
    res.status(201).json(createdProduct);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
        return res.status(400).json({ message: `Product with name "${name}" already exists.` });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Admin
const updateProduct = async (req, res) => {
  const { name, category, price, stock, trackStockAlert, lowStockThreshold } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.category = category || product.category;
      product.price = price || product.price;
      product.stock = stock !== undefined ? stock : product.stock;
      product.trackStockAlert = trackStockAlert !== undefined ? trackStockAlert : product.trackStockAlert;
      product.lowStockThreshold = lowStockThreshold || product.lowStockThreshold;

      if (req.file) {
        // Optional: Delete old image from Cloudinary
        if (product.imageUrl) {
          const publicId = product.imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(publicId);
        }
        product.imageUrl = req.file.path;
      }

      const updatedProduct = await product.save();
      await logActivity(req.user, 'PRODUCT_UPDATED', `Product '${updatedProduct.name}' was updated.`);
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
        return res.status(400).json({ message: `Product with name "${name}" already exists.` });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Optional: Delete image from Cloudinary
      if (product.imageUrl) {
        const publicId = product.imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(publicId);
      }
      const productName = product.name;
      await product.remove();
      await logActivity(req.user, 'PRODUCT_DELETED', `Product '${productName}' was deleted.`);
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};