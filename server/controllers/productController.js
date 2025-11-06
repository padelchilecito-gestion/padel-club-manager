// server/controllers/productController.js (CORREGIDO)
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const { logActivity } = require('../utils/logActivity');

// (getAllProducts, getProductById, getProductsForShop, getProductForShop... no cambian)
// ... (Tu código existente para las otras funciones GET) ...

const getAllProducts = asyncHandler(async (req, res) => {
  // ... (Tu código existente)
});

const getProductById = asyncHandler(async (req, res) => {
  // ... (Tu código existente)
});

const getProductsForShop = asyncHandler(async (req, res) => {
  // ... (Tu código existente)
});

const getProductForShop = asyncHandler(async (req, res) => {
  // ... (Tu código existente)
});


// --- INICIO DE LA CORRECCIÓN ---
// @desc    Crear un nuevo producto
// @route   POST /api/products
// @access  Private/AdminOrOperator
const createProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock, image } = req.body;

  let imageUrl = null;
  let cloudinaryId = null;

  if (image) {
    try {
      const result = await cloudinary.uploader.upload(image, {
        folder: 'padel-club-products',
        width: 800,
        crop: 'limit',
      });
      imageUrl = result.secure_url;
      cloudinaryId = result.public_id;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      res.status(500);
      throw new Error('La subida de la imagen falló. El producto no fue creado.');
    }
  }

  const product = new Product({
    name,
    description,
    price,
    category,
    stock,
    imageUrl,     // <-- Asignar la URL (puede ser null)
    cloudinaryId, // <-- Asignar el ID (puede ser null)
  });

  try {
    const createdProduct = await product.save();
    await logActivity('Product', createdProduct._id, 'create', req.user._id, { name });
    res.status(201).json(createdProduct);
  } catch (error) {
    // Si falla el guardado en DB, pero la imagen SÍ se subió,
    // debemos borrarla de Cloudinary para evitar basura.
    if (cloudinaryId) {
      await cloudinary.uploader.destroy(cloudinaryId);
    }
    console.error('Error al guardar producto en DB:', error);
    res.status(400); // Probablemente un error de validación del modelo
    throw new Error('Error al guardar el producto en la base de datos.');
  }
});
// --- FIN DE LA CORRECCIÓN ---


// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private/AdminOrOperator
const updateProduct = asyncHandler(async (req, res) => {
  // ... (Tu código existente para updateProduct) ...
});

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private/AdminOrOperator
const deleteProduct = asyncHandler(async (req, res) => {
  // ... (Tu código existente para deleteProduct) ...
});

module.exports = {
  getAllProducts,
  getProductById,
  getProductsForShop,
  getProductForShop,
  createProduct,
  updateProduct,
  deleteProduct,
};
