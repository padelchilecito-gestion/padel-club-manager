const express = require('express');
const router = express.Router();
const CashboxSession = require('../models/CashboxSession');
const Sale = require('../models/Sale');
const Booking = require('../models/Booking');
const mongoose = require('mongoose');

// GET: Obtener la sesión de caja abierta actual y sus datos
router.get('/current', async (req, res) => {
    try {
        let session = await CashboxSession.findOne({ status: 'Open' });

        if (!session) {
            return res.json({ session: null, report: null });
        }

        // Calcular ventas en efectivo desde el inicio de la sesión
        const salesInCash = await Sale.aggregate([
            { $match: { saleDate: { $gte: session.startTime }, paymentMethod: 'Efectivo' } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const totalSalesCash = salesInCash.length > 0 ? salesInCash[0].total : 0;

        // Calcular turnos cobrados en efectivo desde el inicio de la sesión
        const bookingsInCash = await Booking.aggregate([
            { $match: { updatedAt: { $gte: session.startTime }, paymentMethod: 'Efectivo', isPaid: true } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const totalBookingsCash = bookingsInCash.length > 0 ? bookingsInCash[0].total : 0;
        
        const expectedTotal = session.startAmount + totalSalesCash + totalBookingsCash;

        res.json({
            session,
            report: {
                totalSalesCash,
                totalBookingsCash,
                expectedTotal
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener la sesión de caja.' });
    }
});

// POST: Iniciar una nueva sesión de caja
router.post('/start', async (req, res) => {
    try {
        const { startAmount } = req.body;
        const existingSession = await CashboxSession.findOne({ status: 'Open' });
        if (existingSession) {
            return res.status(400).json({ message: 'Ya hay una sesión de caja abierta.' });
        }
        const newSession = new CashboxSession({
            startAmount,
            startTime: new Date()
        });
        await newSession.save();
        res.status(201).json(newSession);
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar la caja.' });
    }
});

// POST: Cerrar la sesión de caja actual
router.post('/close', async (req, res) => {
    try {
        const { endAmount, userId } = req.body;
        let session = await CashboxSession.findOne({ status: 'Open' });
        if (!session) {
            return res.status(404).json({ message: 'No hay ninguna sesión de caja abierta para cerrar.' });
        }

        const salesInCash = await Sale.aggregate([
            { $match: { saleDate: { $gte: session.startTime }, paymentMethod: 'Efectivo' } },
            { $group: { _id: null, total: { $sum: "$total" } } }
        ]);
        const totalSalesCash = salesInCash.length > 0 ? salesInCash[0].total : 0;

        const bookingsInCash = await Booking.aggregate([
            { $match: { updatedAt: { $gte: session.startTime }, paymentMethod: 'Efectivo', isPaid: true } },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);
        const totalBookingsCash = bookingsInCash.length > 0 ? bookingsInCash[0].total : 0;
        
        const calculatedTotal = session.startAmount + totalSalesCash + totalBookingsCash;
        const difference = endAmount - calculatedTotal;

        session.status = 'Closed';
        session.endTime = new Date();
        session.endAmount = endAmount;
        session.closedByUser = userId;
        session.totalSalesCash = totalSalesCash;
        session.totalBookingsCash = totalBookingsCash;
        session.calculatedTotal = calculatedTotal;
        session.difference = difference;

        await session.save();
        res.json(session);

    } catch (error) {
        res.status(500).json({ message: 'Error al cerrar la caja.' });
    }
});

module.exports = router;