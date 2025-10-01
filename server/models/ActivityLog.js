const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  username: { // Denormalized for easy display
    type: String,
    required: true,
  },
  action: {
    type: String,
    required: true,
    enum: [
      'USER_LOGIN',
      'USER_REGISTERED',
      'USER_DELETED',
      'COURT_CREATED',
      'COURT_UPDATED',
      'COURT_DELETED',
      'BOOKING_CREATED',
      'BOOKING_CANCELLED',
      'BOOKING_UPDATED',
      'PRODUCT_CREATED',
      'PRODUCT_UPDATED',
      'PRODUCT_DELETED',
      'SALE_REGISTERED',
      'CASHBOX_OPENED',
      'CASHBOX_CLOSED',
    ],
  },
  details: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);