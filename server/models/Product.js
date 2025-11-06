// server/models/Product.js (CORREGIDO)
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  imageUrl: {
    type: String,
  },
  // --- INICIO DE LA CORRECCIÓN ---
  cloudinaryId: {
    type: String, // Campo para almacenar el ID de Cloudinary
  },
  // --- FIN DE LA CORRECCIÓN ---
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

ProductSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
