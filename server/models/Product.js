const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        enum: ['Bebidas', 'Snacks', 'Paletas', 'Accesorios', 'Otros'],
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    imageUrl: {
        type: String 
    },
    // --- NUEVO CAMPO ---
    trackStockAlert: {
        type: Boolean,
        default: true // Por defecto, sí se rastrea el stock
    }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;