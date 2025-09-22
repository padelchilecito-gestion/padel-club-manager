const mongoose = require('mongoose');

const cashboxSessionSchema = new mongoose.Schema({
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    startAmount: { type: Number, required: true },
    endAmount: { type: Number },
    closedByUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Resumen de totales al momento del cierre
    totalSalesCash: { type: Number, default: 0 },
    totalBookingsCash: { type: Number, default: 0 },
    calculatedTotal: { type: Number, default: 0 },
    difference: { type: Number, default: 0 },

    status: {
        type: String,
        enum: ['Open', 'Closed'],
        default: 'Open'
    }
}, { timestamps: true });

const CashboxSession = mongoose.model('CashboxSession', cashboxSessionSchema);
module.exports = CashboxSession;