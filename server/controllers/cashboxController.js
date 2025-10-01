const CashboxSession = require('../models/CashboxSession');
const Sale = require('../models/Sale');
const Booking = require('../models/Booking');
const { logActivity } = require('../utils/logActivity');

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

    const logDetails = `Cashbox session started with ${startAmount.toFixed(2)} ARS by user '${req.user.username}'.`;
    await logActivity(req.user, 'CASHBOX_OPENED', logDetails);

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
        } else {
            totalCardSales += sale.total;
        }
    });

    // 2. Calculate cash payments for bookings during the session
    const cashBookings = await Booking.find({
        isPaid: true,
        paymentMethod: 'Efectivo',
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

    const logDetails = `Cashbox session closed with a final count of ${endAmount.toFixed(2)} ARS by user '${req.user.username}'. Difference: ${difference.toFixed(2)} ARS.`;
    await logActivity(req.user, 'CASHBOX_CLOSED', logDetails);

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