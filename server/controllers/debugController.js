const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Court = require('../models/Court');
const ActivityLog = require('../models/ActivityLog');
const CashboxSession = require('../models/CashboxSession');

const resetDatabase = async (req, res) => {
  try {
    // No borramos los usuarios para mantener el acceso
    await Booking.deleteMany({});
    await Sale.deleteMany({});
    await Product.deleteMany({});
    await Court.deleteMany({});
    await ActivityLog.deleteMany({});
    await CashboxSession.deleteMany({});

    res.status(200).json({ message: 'Base de datos blanqueada (los usuarios no fueron eliminados).' });
  } catch (error) {
    console.error('Error al blanquear la base de datos:', error);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

module.exports = {
  resetDatabase,
};