const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  user: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }, // <-- NUEVO
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Cancelled'],
    default: 'Pending',
  },
  isPaid: {
    type: Boolean,
    default: false,
  },
  paymentMethod: {
    type: String,
    enum: ['Efectivo', 'Mercado Pago', 'Otro', 'Transferencia', 'QR'],
    default: 'Efectivo',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  paymentId: { // <-- NUEVO: ID de Mercado Pago para idempotencia
    type: String,
    sparse: true,
  },
}, { timestamps: true });

// Index to prevent double booking on the same court at the same time
BookingSchema.index({ court: 1, startTime: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'Cancelled' } } });

// Index para asegurar que un ID de pago solo se use una vez
BookingSchema.index({ paymentId: 1 }, { unique: true, sparse: true }); // <-- NUEVO

module.exports = mongoose.model('Booking', BookingSchema);
