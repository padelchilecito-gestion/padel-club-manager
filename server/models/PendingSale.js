const mongoose = require('mongoose');

const pendingSaleItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    }
}, { _id: false });

const pendingSaleSchema = new mongoose.Schema({
    items: [pendingSaleItemSchema],
    total: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1h' // Automatically delete after 1 hour if not paid
    }
});

const PendingSale = mongoose.model('PendingSale', pendingSaleSchema);
module.exports = PendingSale;
