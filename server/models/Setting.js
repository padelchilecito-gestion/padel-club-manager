const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true,
        enum: [
            'SLOT_DURATION',
            'MONDAY_IS_OPEN',
            'MONDAY_OPENING_HOUR',
            'MONDAY_CLOSING_HOUR',
            'TUESDAY_IS_OPEN',
            'TUESDAY_OPENING_HOUR',
            'TUESDAY_CLOSING_HOUR',
            'WEDNESDAY_IS_OPEN',
            'WEDNESDAY_OPENING_HOUR',
            'WEDNESDAY_CLOSING_HOUR',
            'THURSDAY_IS_OPEN',
            'THURSDAY_OPENING_HOUR',
            'THURSDAY_CLOSING_HOUR',
            'FRIDAY_IS_OPEN',
            'FRIDAY_OPENING_HOUR',
            'FRIDAY_CLOSING_HOUR',
            'SATURDAY_IS_OPEN',
            'SATURDAY_OPENING_HOUR',
            'SATURDAY_CLOSING_HOUR',
            'SUNDAY_IS_OPEN',
            'SUNDAY_OPENING_HOUR',
            'SUNDAY_CLOSING_HOUR',
        ],
    },
    value: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model('Setting', settingSchema);
