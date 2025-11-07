const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true,
    },
    clientName: {
        type: String,
        required: true,
    },
    clientPhone: {
        type: String,
        required: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['AwaitingPayment', 'Confirmed', 'Cancelled'],
        default: 'AwaitingPayment',
    },
    isPaid: {
        type: Boolean,
        default: false,
    },
    paymentMethod: {
        type: String,
        enum: ['Efectivo', 'MercadoPago'],
        required: true,
    },
}, {
    timestamps: true,
});

// Índice para evitar reservas duplicadas en la misma cancha y hora.
bookingSchema.index({ court: 1, startTime: 1 }, { unique: true, partialFilterExpression: { status: { $ne: 'Cancelled' } } });

module.exports = mongoose.model('Booking', bookingSchema);
