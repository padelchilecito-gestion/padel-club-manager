const mongoose = require('mongoose');

const PendingPaymentSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  slots: [{
    type: Date,
    required: true,
  }],
  user: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
  },
  total: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '1h' // Se elimina automáticamente después de 1 hora
  }
});

module.exports = mongoose.model('PendingPayment', PendingPaymentSchema);
