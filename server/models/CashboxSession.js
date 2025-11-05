const mongoose = require('mongoose');

const CashboxSessionSchema = new mongoose.Schema({
  startTime: {
    type: Date,
    required: true,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  startAmount: {
    type: Number,
    required: true,
  },
  endAmount: {
    type: Number, // The actual counted amount at closing
  },
  closedByUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['Open', 'Closed'],
    default: 'Open',
  },
  // Summary calculated at closing time
  summary: {
    totalSales: { type: Number, default: 0 },
    totalCashSales: { type: Number, default: 0 },
    totalCardSales: { type: Number, default: 0 }, // Assuming 'Tarjeta' for Mercado Pago POS
    totalCashBookings: { type: Number, default: 0 }, // Cash payments for bookings
    expectedCash: { type: Number, default: 0 },
    difference: { type: Number, default: 0 },
  },
  notes: {
    type: String,
    trim: true,
  },
  movements: [
    {
      type: {
        type: String,
        enum: ['Ingreso', 'Egreso'],
        required: true,
      },
      amount: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
        trim: true,
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      timestamp: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model('CashboxSession', CashboxSessionSchema);