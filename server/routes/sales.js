const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const PendingSale = require('../models/PendingSale');
const { MercadoPagoConfig, Preference } = require('mercadopago');
const Settings = require('../models/Settings');

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

    // Si es con MercadoPago, generamos una preferencia
    if (paymentMethod === 'MercadoPago') {
        try {
            const settings = await Settings.findOne({ configKey: "main_settings" });
            if (!settings || !settings.mercadoPagoAccessToken) {
                return res.status(500).send("El Access Token de Mercado Pago no está configurado.");
            }
            const client = new MercadoPagoConfig({ accessToken: settings.mercadoPagoAccessToken });

            const pendingSale = new PendingSale({ items, total, paymentMethod });
            await pendingSale.save();

            const preferenceBody = {
                items: items.map(item => ({
                    title: item.name, // Asumiendo que el nombre viene en el item
                    quantity: item.quantity,
                    unit_price: Number(item.price),
                })),
                back_urls: {
                    success: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}/admin`,
                    failure: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}/admin`,
                    pending: `${process.env.CORS_ALLOWED_ORIGIN || 'http://localhost:5173'}/admin`
                },
                auto_return: 'approved',
                external_reference: pendingSale._id.toString(),
                notification_url: `${process.env.BACKEND_URL}/payments/webhook?source=pos`, // URL para notificar al webhook
            };

            const preference = new Preference(client);
            const result = await preference.create({ body: preferenceBody });

            return res.status(201).json({ preferenceId: result.id, pendingSaleId: pendingSale._id });

        } catch (error) {
            console.error("Error creating preference for POS sale:", error);
            return res.status(500).json({ message: 'Error al crear la preferencia de pago.' });
        }
    }

    // Lógica para ventas con otros métodos de pago (Efectivo, etc.)
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const sale = new Sale({ items, total, paymentMethod });
        await sale.save({ session });

        for (const item of items) {
            const product = await Product.findById(item.product).session(session);
            if (!product || product.stock < item.quantity) {
                throw new Error(`Stock insuficiente para el producto: ${product ? product.name : 'Desconocido'}`);
            }
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