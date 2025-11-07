const mongoose = require('mongoose');

const courtSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'El nombre de la cancha es obligatorio.'],
        trim: true,
        unique: true,
    },
    courtType: {
        type: String,
        required: [true, 'El tipo de cancha es obligatorio.'],
        enum: ['classic', 'panoramic'],
        trim: true,
    },
    pricePerHour: {
        type: Number,
        required: [true, 'El precio por hora es obligatorio.'],
        min: [0, 'El precio no puede ser negativo.'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Court', courtSchema);
