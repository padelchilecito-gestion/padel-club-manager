// server/controllers/cashboxController.js - CORREGIDO
const CashboxSession = require('../models/CashboxSession');
const Sale = require('../models/Sale');
const Booking = require('../models/Booking');
const { logActivity } = require('../utils/logActivity');
const { validationResult } = require('express-validator');

// Obtener la sesión de caja activa
const getActiveCashboxSession = async (req, res) => {
  try {
    const activeSession = await CashboxSession.findOne({ user: req.user._id, endTime: null }).populate('user', 'name');
    res.json(activeSession);
  } catch (error) {
    console.error('Error fetching active cashbox session:', error);
    res.status(500).json({ message: 'Error al obtener la sesión de caja' });
  }
};

// Iniciar una nueva sesión de caja
const startCashboxSession = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // --- INICIO DE LA CORRECCIÓN ---
  // El startAmount debe leerse desde req.body
  const { startAmount } = req.body;

  // Validar que startAmount se recibió
  if (startAmount === undefined || startAmount === null || startAmount < 0) {
    return res.status(400).json({ message: 'El monto inicial (startAmount) es requerido y debe ser positivo.' });
  }
  // --- FIN DE LA CORRECCIÓN ---

  try {
    const activeSession = await CashboxSession.findOne({ user: req.user._id, endTime: null });
    if (activeSession) {
      return res.status(400).json({ message: 'Ya hay una sesión de caja activa' });
    }

    const newSession = new CashboxSession({
      user: req.user._id,
      startAmount: parseFloat(startAmount), // <-- USAR EL VALOR DE REQ.BODY
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

// Cerrar la sesión de caja activa
const closeCashboxSession = async (req, res) => {
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
    session.report = report; // Guardar el reporte calculado en la sesión

    await session.save();
    
    logActivity(req.user._id, 'CASHBOX_END', `Cerró sesión de caja. Total calculado: $${session.endAmount}`);
    res.json(session);

  } catch (error) {
    console.error('Error closing cashbox session:', error);
    res.status(500).json({ message: 'Error al cerrar la sesión de caja' });
  }
};

// Obtener reporte de la sesión activa
const getActiveSessionReport = async (req, res) => {
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

// --- Función Helper (Interna) ---
const getCashboxReportData = async (session) => {
  const sales = await Sale.find({
    status: 'Completed',
    createdAt: { $gte: session.startTime }
  });

  const bookings = await Booking.find({
    isPaid: true,
    // Asumimos que la reserva se paga cuando se confirma, o necesitamos un 'paidAt'
    updatedAt: { $gte: session.startTime }
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
    // Solo contar reservas hechas *después* del inicio de la sesión
    // Esto es un proxy, idealmente 'paidAt' sería mejor
    if (booking.updatedAt >= session.startTime && booking.createdAt < session.startTime) {
       // Si se creó antes pero se pagó durante la sesión
       totalBookings += booking.price;
    } else if (booking.createdAt >= session.startTime) {
       // Si se creó Y pagó durante la sesión
       totalBookings += booking.price;
    }

    // (Este bloque asume que el booking.paymentMethod se setea correctamente)
    if (booking.paymentMethod === 'Efectivo') {
      cashBookings += booking.price;
    } else if (booking.paymentMethod === 'Mercado Pago') {
      mpBookings += booking.price;
    } else if (booking.paymentMethod !== 'Pending') { // Asumir 'other' si no es pendiente
      otherBookings += booking.price;
    }
  });
  
  // Total efectivo esperado en caja
  const calculatedEndAmount = session.startAmount + cashSales + cashBookings;

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
    totalCash: cashSales + cashBookings,
    totalMP: mpSales + mpBookings,
    totalOther: otherSales + otherBookings,
    totalRevenue: totalSales + totalBookings,
    calculatedEndAmount,
  };
};


module.exports = {
  getActiveCashboxSession,
  startCashboxSession,
  closeCashboxSession,
  getActiveSessionReport,
};
