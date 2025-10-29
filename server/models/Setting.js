// server/models/Setting.js
const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    enum: [
      // --- Claves de API (Cloudinary y Timezone eliminadas) ---
      'WHATSAPP_SENDER_NUMBER', // Para API (si se usa)
      'WHATSAPP_API_TOKEN',   // Para API (si se usa)
      'SHOP_ENABLED',
      
      // --- Claves de Horario ---
      'SLOT_DURATION',
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
      'SUNDAY_CLOSING_HOUR',
      
      // --- Claves de Info del Club ---
      'CLUB_NOMBRE',
      'CLUB_DIRECCION',
      'CLUB_TELEFONO', // Teléfono público del club
      'CLUB_EMAIL',
      'CLUB_ADMIN_WHATSAPP', // <-- NUEVO CAMPO AÑADIDO (para notificaciones)
      
      // --- Claves Viejas (se mantienen para compatibilidad, pero se ocultan en frontend) ---
      'WEEKDAY_OPENING_HOUR',
      'WEEKDAY_CLOSING_HOUR',
      'WEEKEND_OPENING_HOUR',
      'WEEKEND_CLOSING_HOUR',
      
      // Claves eliminadas que pueden seguir en la DB pero no se usarán:
      'CLOUDINARY_CLOUD_NAME',
      'CLOUDINARY_API_KEY',
      'CLOUDINARY_API_SECRET',
      'TIMEZONE',
      'MERCADOPAGO_ACCESS_TOKEN',
      'MERCADOPAGO_WEBHOOK_SECRET'
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
