const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const BookingSchema = new mongoose.Schema({
  court: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Court',
    required: true,
  },
  user: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
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
    enum: ['Pending', 'Confirmed', 'Cancelled', 'Cancelled with Penalty', 'Finalizado'],
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
  cancellationReason: {
      type: String,
  },
  penaltyAmount: {
      type: Number,
      default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

BookingSchema.plugin(mongoosePaginate);

// Indexes
BookingSchema.index({ startTime: 1, court: 1 });
BookingSchema.index({ 'user.phone': 1 });
BookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', BookingSchema);