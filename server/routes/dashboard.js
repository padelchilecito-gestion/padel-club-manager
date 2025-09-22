const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Booking = require('../models/Booking');
const Product = require('../models/Product');

// GET: Obtener todos los datos para el dashboard principal
router.get('/', async (req, res) => {
    try {
        const today = new Date();
        const startOfDay = new Date(today.setHours(0, 0, 0, 0));
        const endOfDay = new Date(today.setHours(23, 59, 59, 999));

        // 1. Calcular ingresos por ventas de productos del día
        const dailySales = await Sale.find({
            saleDate: { $gte: startOfDay, $lte: endOfDay }
        });
        const salesTotal = dailySales.reduce((sum, sale) => sum + sale.total, 0);

        // 2. Calcular ingresos por reservas del día
        const dailyBookings = await Booking.find({
            startTime: { $gte: startOfDay, $lte: endOfDay },
            status: 'Confirmed'
        }).populate('court');
        
        const bookingsTotal = dailyBookings.reduce((sum, booking) => sum + (booking.price || 0), 0);

        // 3. Obtener las próximas 5 reservas (Confirmadas o Pendientes)
        const upcomingBookings = await Booking.find({
            startTime: { $gte: new Date() },
            status: { $in: ['Confirmed', 'Pending'] }
        })
        .sort({ startTime: 1 })
        .limit(5)
        .populate('court', 'name');

        // 4. ⭐ MODIFICADO: Obtener productos con bajo stock que tengan el seguimiento activado
        const lowStockProducts = await Product.find({
            stock: { $lt: 5 },
            trackStockAlert: true // <-- Se añade esta condición
        }).sort({ stock: 1 });

        // 5. Enviar todos los datos juntos
        res.json({
            dailyRevenue: salesTotal + bookingsTotal,
            upcomingBookings,
            lowStockProducts
        });

    } catch (error) {
        console.error("Error en el dashboard:", error);
        res.status(500).json({ message: 'Error al obtener los datos del dashboard.', error: error.message });
    }
});

module.exports = router;