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
      
      // Claves antiguas de WhatsApp (Eliminadas)
      // 'WHATSAPP_SENDER_NUMBER',
      // 'WHATSAPP_API_TOKEN',
      
      'TIMEZONE',
      'WEEKDAY_OPENING_HOUR',
      'WEEKDAY_CLOSING_HOUR',
      'WEEKEND_OPENING_HOUR',
      'WEEKEND_CLOSING_HOUR',
      'BUSINESS_HOURS',
      'SHOP_ENABLED',

      // --- NUEVAS CLAVES DE PERSONALIZACIÓN ---
      'PUBLIC_TITLE',           // Ej: "Padel Club Manager"
      'PUBLIC_SUBTITLE',        // Ej: "Encuentra y reserva tu cancha..."
      'PUBLIC_CONTACT_NUMBER',  // Número para el botón "Contacto"
      'OWNER_NOTIFICATION_NUMBER' // Número del dueño para recibir avisos
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
