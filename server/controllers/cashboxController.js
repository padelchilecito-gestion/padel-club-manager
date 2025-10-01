const CashboxSession = require('../models/CashboxSession');
const Sale = require('../models/Sale');
const Booking = require('../models/Booking');

// @desc    Start a new cashbox session
// @route   POST /api/cashbox/start
// @access  Operator/Admin
const startCashboxSession = async (req, res) => {
  const { startAmount } = req.body;

  try {
    const openSession = await CashboxSession.findOne({ status: 'Open' });
    if (openSession) {
      return res.status(400).json({ message: 'An open cashbox session already exists.' });
    }

    const session = new CashboxSession({
      startAmount,
      closedByUser: req.user.id, // Temporarily store who started it
    });

    const createdSession = await session.save();
    res.status(201).json(createdSession);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Close the current cashbox session
// @route   POST /api/cashbox/close
// @access  Operator/Admin
const closeCashboxSession = async (req, res) => {
  const { endAmount, notes } = req.body;

  try {
    const session = await CashboxSession.findOne({ status: 'Open' });
    if (!session) {
      return res.status(404).json({ message: 'No open cashbox session found.' });
    }

    const endTime = new Date();

    // 1. Calculate sales during the session
    const sales = await Sale.find({
      createdAt: { $gte: session.startTime, $lte: endTime },
    });

    let totalSales = 0;
    let totalCashSales = 0;
    let totalCardSales = 0;
    sales.forEach(sale => {
        totalSales += sale.total;
        if (sale.paymentMethod === 'Efectivo') {
            totalCashSales += sale.total;
        } else { // Mercado Pago, Tarjeta, etc.
            totalCardSales += sale.total;
        }
    });

    // 2. Calculate cash payments for bookings during the session
    const cashBookings = await Booking.find({
        isPaid: true,
        paymentMethod: 'Efectivo',
        // This logic assumes payment time is close to booking creation/update.
        // A more robust system would have a `paymentTimestamp`.
        updatedAt: { $gte: session.startTime, $lte: endTime },
    });
    const totalCashBookings = cashBookings.reduce((acc, booking) => acc + booking.price, 0);


    // 3. Calculate summary
    const expectedCash = session.startAmount + totalCashSales + totalCashBookings;
    const difference = endAmount - expectedCash;

    // 4. Update and close the session
    session.endTime = endTime;
    session.endAmount = endAmount;
    session.closedByUser = req.user.id;
    session.status = 'Closed';
    session.notes = notes || '';
    session.summary = {
      totalSales,
      totalCashSales,
      totalCardSales,
      totalCashBookings,
      expectedCash,
      difference,
    };

    const closedSession = await session.save();
    res.json(closedSession);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get the current open cashbox session
// @route   GET /api/cashbox/current
// @access  Operator/Admin
const getCurrentCashboxSession = async (req, res) => {
  try {
    const session = await CashboxSession.findOne({ status: 'Open' });
    if (!session) {
        // Return a specific status or object to indicate no open session
        return res.status(200).json(null);
    }
    res.json(session);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get the last closed session
// @route   GET /api/cashbox/last-closed
// @access  Operator/Admin
const getLastClosedSession = async (req, res) => {
    try {
        const session = await CashboxSession.findOne({ status: 'Closed' }).sort({ endTime: -1 });
        res.json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
  startCashboxSession,
  closeCashboxSession,
  getCurrentCashboxSession,
  getLastClosedSession,
};