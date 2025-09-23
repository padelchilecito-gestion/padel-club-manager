// server/models/PendingSale.js
const mongoose = require('mongoose');

const pendingSaleSchema = new mongoose.Schema({
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: Number,
        price: Number
    }],
    total: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        // El QR será válido por 15 minutos
        expires: '15m'
    }
});

const PendingSale = mongoose.model('PendingSale', pendingSaleSchema);
module.exports = PendingSale;
