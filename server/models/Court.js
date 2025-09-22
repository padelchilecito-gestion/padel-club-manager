const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        default: 'Cancha Principal'
    },
    courtType: {
        type: String,
        enum: ['Cemento', 'Césped Sintético', 'Cristal'],
        default: 'Cemento'
    },
    pricePerHour: {
        type: Number,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const Court = mongoose.model('Court', courtSchema);
module.exports = Court;