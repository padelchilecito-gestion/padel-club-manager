const mongoose = require('mongoose');

const fixedBookingSchema = new mongoose.Schema({
    court: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Court',
        required: true
    },
    user: {
        name: { type: String, required: true },
        phone: { type: String, required: true }
    },
    // Día de la semana (0=Domingo, 1=Lunes, ..., 6=Sábado)
    dayOfWeek: {
        type: Number,
        required: true,
        min: 0,
        max: 6
    },
    // Hora de inicio (ej: "20:30")
    time: {
        type: String,
        required: true,
    },
    // Fecha hasta la cual el turno fijo es válido
    endDate: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const FixedBooking = mongoose.model('FixedBooking', fixedBookingSchema);
module.exports = FixedBooking;