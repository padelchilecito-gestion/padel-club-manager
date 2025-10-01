const mongoose = require('mongoose');

const CourtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true,
  },
  courtType: {
    type: String,
    required: true,
    enum: ['Cemento', 'Césped Sintético', 'Cristal'],
  },
  pricePerHour: {
    type: Number,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Court', CourtSchema);