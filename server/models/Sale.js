const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    },
  ],
  total: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ['Efectivo', 'Mercado Pago', 'Tarjeta'],
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true, // The user (operator/admin) who made the sale
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentId: { // <-- NUEVO: ID de Mercado Pago para idempotencia
    type: String,
    sparse: true,
  },
});

// Index para asegurar que un ID de pago solo se use una vez
SaleSchema.index({ paymentId: 1 }, { unique: true, sparse: true }); // <-- NUEVO

module.exports = mongoose.model('Sale', SaleSchema);
