const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: [
      'MERCADOPAGO_ACCESS_TOKEN',
      'MERCADOPAGO_WEBHOOK_SECRET',
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'WHATSAPP_SENDER_NUMBER',
      'WHATSAPP_API_TOKEN',
      // Nuevas claves
      'TIMEZONE',
      'WEEKDAY_OPENING_HOUR',
      'WEEKDAY_CLOSING_HOUR',
      'WEEKEND_OPENING_HOUR',
'WEEKEND_CLOSING_HOUR',
    'SHOP_ENABLED' // ← AGREGAR ESTA LÍNEA
    ],
  },
  value: {
    type: String,
    required: true,
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, { timestamps: true });

module.exports = mongoose.model('Setting', SettingSchema);
