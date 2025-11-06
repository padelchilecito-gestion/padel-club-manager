// server/controllers/productController.js (CORREGIDO Y COMPLETADO)
const asyncHandler = require('express-async-handler');
const Product = require('../models/Product');
const cloudinary = require('../config/cloudinary');
const { logActivity } = require('../utils/logActivity');

// --- INICIO DE LA CORRECCIÓN ---
// Implementación de las funciones GET que faltaban

// @desc    Obtener todos los productos (para Admin)
// @route   GET /api/products
// @access  Public (según el router)
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({}).sort({ createdAt: -1 });
  res.json(products);
});

// @desc    Obtener un producto por ID
// @route   GET /api/products/:id
// @access  Public (según el router)
const getProductById = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Producto no encontrado');
  }
});

// @desc    Obtener productos para la tienda (Shop)
// @route   GET /api/products/shop
// @access  Public (según el router)
const getProductsForShop = asyncHandler(async (req, res) => {
  // Por ahora, devuelve todos los productos.
  // Se podría filtrar por stock > 0 si se desea.
  const products = await Product.find({}).sort({ name: 1 });
  res.json(products);
});

// @desc    Obtener un producto por ID para la tienda (Shop)
// @route   GET /api/products/shop/:id
// @access  Public (según el router)
const getProductForShop = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Producto no encontrado');
  }
});

// --- FIN DE LA CORRECCIÓN ---


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
    imageUrl,     // Asignar la URL (puede ser null)
    cloudinaryId, // Asignar el ID (puede ser null)
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


// @desc    Actualizar un producto
// @route   PUT /api/products/:id
// @access  Private/AdminOrOperator
const updateProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, stock, image } = req.body;

  const product = await Product.findById(req.params.id);

  if (!product) {
    res.status(404);
    throw new Error('Producto no encontrado');
  }

  // Guardar datos antiguos para el log
  const oldData = { name: product.name, price: product.price, stock: product.stock };

  let imageUrl = product.imageUrl;
  let cloudinaryId = product.cloudinaryId;

  // Manejo de imagen:
  // 1. Si se envía una NUEVA imagen (data:image...)
  if (image && image.startsWith('data:image')) {
    // Borrar la imagen antigua de Cloudinary, si existía
    if (product.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(product.cloudinaryId);
      } catch (error) {
        console.error('No se pudo borrar la imagen antigua de Cloudinary:', error);
      }
    }

    // Subir la nueva imagen
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
      throw new Error('La subida de la nueva imagen falló.');
    }
  }
  // 2. Si se envía un 'null' o string vacío, significa que se quiere ELIMINAR la imagen
  else if (image === null || image === '') {
     if (product.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(product.cloudinaryId);
      } catch (error) {
        console.error('No se pudo borrar la imagen antigua de Cloudinary:', error);
      }
    }
    imageUrl = null;
    cloudinaryId = null;
  }
  // 3. Si no se envía 'image' o es la misma URL, no se hace nada y se conserva la existente.

  // Actualizar campos del producto
  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price !== undefined ? price : product.price;
  product.category = category || product.category;
  product.stock = stock !== undefined ? stock : product.stock;
  product.imageUrl = imageUrl;
  product.cloudinaryId = cloudinaryId;

  const updatedProduct = await product.save();

  await logActivity('Product', updatedProduct._id, 'update', req.user._id, {
    old: oldData,
    new: { name: updatedProduct.name, price: updatedProduct.price, stock: updatedProduct.stock }
  });

  res.json(updatedProduct);
});

// @desc    Eliminar un producto
// @route   DELETE /api/products/:id
// @access  Private/AdminOrOperator
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);

  if (product) {
    // Si tiene una imagen en Cloudinary, borrarla
    if (product.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(product.cloudinaryId);
      } catch (error)
      {
        console.error('Error al borrar imagen de Cloudinary durante eliminación de producto:', error);
        // No detenemos el proceso, solo lo logueamos.
      }
    }

    // Eliminar de la base de datos
    await product.deleteOne(); // O product.remove() en versiones antiguas

    await logActivity('Product', req.params.id, 'delete', req.user._id, { name: product.name });

    res.json({ message: 'Producto eliminado' });
  } else {
    res.status(404);
    throw new Error('Producto no encontrado');
  }
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