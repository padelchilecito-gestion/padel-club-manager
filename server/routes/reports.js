const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Booking = require('../models/Booking');
const Product = require('../models/Product');
const Court = require('../models/Court');
const mongoose = require('mongoose');

// GET: Ingresos de ventas de los últimos 30 días
router.get('/sales-revenue-last-30-days', async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const revenue = await Sale.aggregate([
            { $match: { saleDate: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$saleDate" } },
                    total: { $sum: "$total" }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        res.json(revenue);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ingresos por ventas.' });
    }
});

// GET: Top 5 productos más vendidos
router.get('/top-selling-products', async (req, res) => {
    try {
        const topProducts = await Sale.aggregate([
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    totalQuantity: { $sum: "$items.quantity" }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: Product.collection.name,
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            { $unwind: "$productDetails" }
        ]);
        res.json(topProducts);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener top productos.' });
    }
});

// GET: Ocupación de canchas (total de reservas por cancha)
router.get('/court-occupancy', async (req, res) => {
    try {
        const occupancy = await Booking.aggregate([
            { $match: { status: 'Confirmed' } },
            {
                $group: {
                    _id: "$court",
                    count: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: Court.collection.name,
                    localField: "_id",
                    foreignField: "_id",
                    as: "courtDetails"
                }
            },
            { $unwind: "$courtDetails" },
            { $sort: { count: -1 } }
        ]);
        res.json(occupancy);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener ocupación de canchas.' });
    }
});

module.exports = router;