const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    configKey: {
        type: String,
        default: "main_settings",
        unique: true
    },
    mercadoPagoPublicKey: {
        type: String,
        trim: true
    },
    mercadoPagoAccessToken: {
        type: String,
        trim: true
    },
    // Nuevo campo para el número de WhatsApp
    whatsappNumber: {
        type: String,
        trim: true
    }
});

const Settings = mongoose.model('Settings', settingsSchema);
module.exports = Settings;