// server/models/Setting.js
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
      'TIMEZONE',
      'SHOP_ENABLED',
      'SLOT_DURATION',
      
      // --- NUEVAS CLAVES DE HORARIO ---
      'MONDAY_IS_OPEN',
      'MONDAY_OPENING_HOUR',
      'MONDAY_CLOSING_HOUR',
      'TUESDAY_IS_OPEN',
      'TUESDAY_OPENING_HOUR',
      'TUESDAY_CLOSING_HOUR',
      'WEDNESDAY_IS_OPEN',
      'WEDNESDAY_OPENING_HOUR',
      'WEDNESDAY_CLOSING_HOUR',
      'THURSDAY_IS_OPEN',
      'THURSDAY_OPENING_HOUR',
      'THURSDAY_CLOSING_HOUR',
      'FRIDAY_IS_OPEN',
      'FRIDAY_OPENING_HOUR',
      'FRIDAY_CLOSING_HOUR',
      'SATURDAY_IS_OPEN',
      'SATURDAY_OPENING_HOUR',
      'SATURDAY_CLOSING_HOUR',
      'SUNDAY_IS_OPEN',
      'SUNDAY_OPENING_HOUR',
      'SUNDAY_CLOSING_HOUR'
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

// Filtramos claves viejas que ya no deberían estar en el enum
SettingSchema.path('key').enum(SettingSchema.path('key').enumValues.filter(k => 
  !k.startsWith('WEEKDAY_') && !k.startsWith('WEEKEND_')
));

module.exports = mongoose.model('Setting', SettingSchema);
