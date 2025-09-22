const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const upload = require('../config/cloudinary');

// GET (Público): Obtener solo productos de pádel para la tienda
router.get('/public', async (req, res) => {
    try {
        const paddleProducts = await Product.find({
            category: { $in: ['Paletas', 'Accesorios'] }
        });
        res.json(paddleProducts);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos públicos." });
    }
});

// GET (Admin): Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const products = await Product.find({}).sort({ category: 1, name: 1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los productos." });
    }
});

// POST (Admin): Crear un nuevo producto (con imagen)
router.post('/', upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, stock } = req.body;
        const newProductData = { name, category, price, stock };

        if (req.file) {
            newProductData.imageUrl = req.file.path;
        }

        const newProduct = new Product(newProductData);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        res.status(400).json({ message: "Error al crear el producto." });
    }
});

// PUT (Admin): Actualizar un producto (con imagen)
router.put('/:id', upload.single('image'), async (req, res) => {
    try {
        const { name, category, price, stock } = req.body;
        const updateData = { name, category, price, stock };

        if (req.file) {
            updateData.imageUrl = req.file.path;
        }

        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
        if (!updatedProduct) {
             return res.status(404).json({ message: "Producto no encontrado." });
        }
        res.json(updatedProduct);
    } catch (error) {
        res.status(400).json({ message: "Error al actualizar el producto." });
    }
});

// DELETE (Admin): Eliminar un producto
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
         if (!deletedProduct) {
            return res.status(404).json({ message: "Producto no encontrado." });
        }
        res.json({ message: 'Producto eliminado correctamente.' });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el producto." });
    }
});

module.exports = router;