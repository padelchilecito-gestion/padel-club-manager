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
  pricePerHour: { // Este será el precio de 60 MINUTOS
    type: Number,
    required: true,
  },
  // --- CAMPOS NUEVOS ---
  pricePer90Min: { // Precio especial para 90 MINUTOS
    type: Number,
    required: false,
  },
  pricePer120Min: { // Precio especial para 120 MINUTOS
    type: Number,
    required: false,
  },
  // --------------------
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
