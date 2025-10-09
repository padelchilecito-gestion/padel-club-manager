const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Court = require('../models/Court');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const CashboxSession = require('../models/CashboxSession');

// @desc    Reset the database
// @route   DELETE /api/debug/reset-database
// @access  Admin
const resetDatabase = async (req, res) => {
  try {
    // NO borres los usuarios para poder seguir accediendo
    // await User.deleteMany({});
    await Booking.deleteMany({});
    await Sale.deleteMany({});
    await Product.deleteMany({});
    await Court.deleteMany({});
    await ActivityLog.deleteMany({});
    await CashboxSession.deleteMany({});

    res.status(200).json({ message: 'Database cleared successfully (Users were not deleted).' });
  } catch (error) {
    console.error('Error resetting database:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  resetDatabase,
};