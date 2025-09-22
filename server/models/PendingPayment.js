const mongoose = require('mongoose');

const pendingPaymentSchema = new mongoose.Schema({
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true
    },
    user: {
        name: { type: String, required: true },
        phone: { type: String, required: true }
    },
    slots: [{
        time: String,
        hour: Number,
        minute: Number
    }],
    date: {
        type: Date,
        required: true
    },
    total: Number,
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '1h' // Automatically delete after 1 hour
    }
});

const PendingPayment = mongoose.model('PendingPayment', pendingPaymentSchema);
module.exports = PendingPayment;
