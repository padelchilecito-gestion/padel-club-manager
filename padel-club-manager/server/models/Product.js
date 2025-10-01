const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['Bebidas', 'Snacks', 'Accesorios', 'Ropa', 'Otros'],
    default: 'Otros',
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  imageUrl: {
    type: String,
    required: false, // Will be populated from Cloudinary
  },
  trackStockAlert: {
    type: Boolean,
    default: true,
  },
  lowStockThreshold: {
    type: Number,
    default: 5,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Product', ProductSchema);