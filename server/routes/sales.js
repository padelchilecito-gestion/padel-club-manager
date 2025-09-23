const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// GET (Admin): Obtener el historial de ventas
router.get('/', async (req, res) => {
    try {
        const sales = await Sale.find({})
            .sort({ saleDate: -1 })
            .populate('items.product', 'name');
        res.json(sales);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el historial de ventas." });
    }
});

// POST: Registrar una nueva venta
router.post('/', async (req, res) => {
    const { items, total, paymentMethod } = req.body;

    if (!items || items.length === 0 || !total || !paymentMethod) {
        return res.status(400).json({ message: "Datos de la venta incompletos." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const sale = new Sale({ items, total, paymentMethod });
        await sale.save({ session });

        for (const item of items) {
            await Product.findByIdAndUpdate(item.product, 
                { $inc: { stock: -item.quantity } },
                { session }
            );
        }

        await session.commitTransaction();
        res.status(201).json({ message: "Venta registrada con éxito", sale });

    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: "Error al registrar la venta.", error: error.message });
    } finally {
        session.endSession();
    }
});

module.exports = router;