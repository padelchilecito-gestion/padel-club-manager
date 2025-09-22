const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({ /* ... (sin cambios) ... */ });

const saleSchema = new mongoose.Schema({
    items: [saleItemSchema],
    total: {
        type: Number,
        required: true
    },
    saleDate: {
        type: Date,
        default: Date.now
    },
    // --- NUEVO CAMPO ---
    paymentMethod: {
        type: String,
        enum: ['Efectivo', 'MercadoPago', 'Otro'],
        required: true
    }
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;