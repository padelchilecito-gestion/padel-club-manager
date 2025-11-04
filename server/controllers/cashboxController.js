// server/controllers/cashboxController.js
const CashboxSession = require('../models/CashboxSession');
const Sale = require('../models/Sale');
const Booking = require('../models/Booking');
const { logActivity } = require('../utils/logActivity');
const { validationResult } = require('express-validator');

// @desc    Get the active cashbox session
// @route   GET /api/cashbox/session
// @access  Admin/Operator
const getCashboxSession = async (req, res) => {
  try {
    const activeSession = await CashboxSession.findOne({ user: req.user._id, endTime: null }).populate('user', 'name');
    res.json(activeSession);
  } catch (error) {
    console.error('Error fetching active cashbox session:', error);
    res.status(500).json({ message: 'Error al obtener la sesión de caja' });
  }
};

// @desc    Start a new cashbox session
// @route   POST /api/cashbox/start
// @access  Admin/Operator
const startSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { startAmount } = req.body;

  if (startAmount === undefined || startAmount === null || startAmount < 0) {
    return res.status(400).json({ message: 'El monto inicial (startAmount) es requerido y debe ser positivo.' });
  }

  try {
    const activeSession = await CashboxSession.findOne({ user: req.user._id, endTime: null });
    if (activeSession) {
      return res.status(400).json({ message: 'Ya hay una sesión de caja activa' });
    }

    const newSession = new CashboxSession({
      user: req.user._id,
      startAmount: parseFloat(startAmount),
      startTime: new Date(),
    });

    await newSession.save();
    
    logActivity(req.user._id, 'CASHBOX_START', `Inició sesión de caja con $${startAmount}`);
    res.status(201).json(newSession);

  } catch (error) {
    console.error('Error starting cashbox session:', error);
    res.status(500).json({ message: 'Error al iniciar la sesión de caja' });
  }
};

// @desc    Close the active cashbox session
// @route   POST /api/cashbox/end
// @access  Admin/Operator
const closeSession = async (req, res) => {
  const { notes } = req.body;

  try {
    const session = await CashboxSession.findOne({ user: req.user._id, endTime: null });
    if (!session) {
      return res.status(404).json({ message: 'No hay sesión de caja activa para cerrar' });
    }

    const report = await getCashboxReportData(session);

    session.endTime = new Date();
    session.endAmount = report.calculatedEndAmount;
    session.notes = notes || '';
    session.report = report;

    await session.save();
    
    logActivity(req.user._id, 'CASHBOX_END', `Cerró sesión de caja. Total calculado: $${session.endAmount}`);
    res.json(session);

  } catch (error) {
    console.error('Error closing cashbox session:', error);
    res.status(500).json({ message: 'Error al cerrar la sesión de caja' });
  }
};

// @desc    Get a report of the active session
// @route   GET /api/cashbox/summary
// @access  Admin/Operator
const getSessionReport = async (req, res) => {
  try {
    const session = await CashboxSession.findOne({ user: req.user._id, endTime: null });
    if (!session) {
      return res.status(404).json({ message: 'No hay sesión de caja activa' });
    }

    const report = await getCashboxReportData(session);
    res.json(report);

  } catch (error) {
    console.error('Error generating cashbox report:', error);
    res.status(500).json({ message: 'Error al generar el reporte de caja' });
  }
};

// @desc    Add a movement (IN/OUT) to the cashbox
// @route   POST /api/cashbox/movement
// @access  Admin/Operator
const addCashboxMovement = async (req, res) => {
  const { type, amount, description } = req.body;

  try {
    const session = await CashboxSession.findOne({ user: req.user._id, endTime: null });
    if (!session) {
      return res.status(404).json({ message: 'No hay sesión de caja activa para registrar un movimiento' });
    }

    const movement = {
      type,
      amount: parseFloat(amount),
      description,
      timestamp: new Date(),
    };

    session.movements.push(movement);
    await session.save();

    logActivity(req.user._id, 'CASHBOX_MOVEMENT', `Registró movimiento de ${type}: $${amount} - ${description}`);
    res.status(201).json(session);

  } catch (error) {
    console.error('Error adding cashbox movement:', error);
    res.status(500).json({ message: 'Error al registrar el movimiento de caja' });
  }
};

// --- Helper Function (Internal) ---
const getCashboxReportData = async (session) => {
  const sales = await Sale.find({
    status: 'Completed',
    createdAt: { $gte: session.startTime, $lte: session.endTime || new Date() }
  });

  const bookings = await Booking.find({
    isPaid: true,
    updatedAt: { $gte: session.startTime, $lte: session.endTime || new Date() }
  });

  let totalSales = 0;
  let cashSales = 0;
  let mpSales = 0;
  let otherSales = 0;

  sales.forEach(sale => {
    totalSales += sale.total;
    if (sale.paymentMethod === 'Efectivo') {
      cashSales += sale.total;
    } else if (sale.paymentMethod === 'Mercado Pago (QR)' || sale.paymentMethod === 'Mercado Pago') {
      mpSales += sale.total;
    } else {
      otherSales += sale.total;
    }
  });

  let totalBookings = 0;
  let cashBookings = 0;
  let mpBookings = 0;
  let otherBookings = 0;

  bookings.forEach(booking => {
    totalBookings += booking.price;
    if (booking.paymentMethod === 'Efectivo') {
      cashBookings += booking.price;
    } else if (booking.paymentMethod === 'Mercado Pago') {
      mpBookings += booking.price;
    } else if (booking.paymentMethod !== 'Pending') {
      otherBookings += booking.price;
    }
  });

  const movementsIn = session.movements.filter(m => m.type === 'IN').reduce((acc, m) => acc + m.amount, 0);
  const movementsOut = session.movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.amount, 0);
  
  const calculatedEndAmount = session.startAmount + cashSales + cashBookings + movementsIn - movementsOut;

  return {
    startAmount: session.startAmount,
    totalSales,
    cashSales,
    mpSales,
    otherSales,
    totalBookings,
    cashBookings,
    mpBookings,
    otherBookings,
    movementsIn,
    movementsOut,
    totalCash: cashSales + cashBookings,
    totalMP: mpSales + mpBookings,
    totalOther: otherSales + otherBookings,
    totalRevenue: totalSales + totalBookings,
    calculatedEndAmount,
  };
};

module.exports = {
  getCashboxSession,
  startSession,
  closeSession,
  getSessionReport,
  addCashboxMovement,
};
