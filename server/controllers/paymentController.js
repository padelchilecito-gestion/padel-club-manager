const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');
// Importamos el helper de booking
const { _createBookingFromData } = require('./bookingController'); 

// @desc    Create a Mercado Pago payment preference
// @route   POST /api/payments/create-preference
// @access  Public / Operator
const createPaymentPreference = async (req, res) => {
  const { items, payer, metadata } = req.body;

  if (!payer || !payer.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payer.email)) {
    return res.status(400).json({ message: 'A valid payer email is required.' });
  }

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  // --- LÓGICA DE BACK_URLS CORREGIDA (Arregla Bug 3) ---
  let successUrl = `${process.env.CLIENT_URL}/payment-success`; // Default para reservas
  let backUrls = {
    failure: `${process.env.CLIENT_URL}/payment-failure`,
    pending: `${process.env.CLIENT_URL}/payment-pending`,
  };

  if (metadata && metadata.booking_id === 'PENDING' && metadata.booking_data) {
    // --- Lógica para RESERVAS ---
    try {
        const { user, startTime, endTime } = metadata.booking_data;
        const params = new URLSearchParams({
            name: user.name,
            startTime: startTime,
            endTime: endTime
        }).toString();
        successUrl = `${process.env.CLIENT_URL}/payment-success?${params}`;
    } catch (e) { console.error("Error creating booking success URL", e); }
    backUrls.success = successUrl;
    backUrls.auto_return = 'approved';

  } else if (metadata && metadata.isPosSale === true) {
    // --- ¡NUEVO! Lógica para VENTAS DEL POS ---
    // El cliente (que paga con su tel) vuelve al inicio, no a la pág. de éxito de reservas.
    backUrls.success = `${process.env.CLIENT_URL}/`; 
    backUrls.auto_return = 'approved'; 
  
  } else {
    // --- Lógica para otros casos (ej. admin pagando una reserva existente) ---
    backUrls.success = successUrl;
    backUrls.auto_return = 'approved';
  }
  // --- FIN DE LA LÓGICA CORREGIDA ---

  const preferenceBody = {
    items: items.map(item => ({
      title: item.title,
      unit_price: Number(item.unit_price),
      quantity: Number(item.quantity),
      currency_id: 'ARS',
    })),
    payer: {
      name: payer.name,
      email: payer.email,
    },
    back_urls: backUrls, // <-- Usamos el objeto de URLs dinámico
    notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
    metadata: metadata,
  };

  try {
    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceBody });
    res.json({ id: result.id, init_point: result.init_point });
  } catch (error) {
    console.error('Error creating Mercado Pago preference:', error);
    res.status(500).json({ message: 'Failed to create payment preference.' });
  }
};

// @desc    Receive Mercado Pago webhook notifications
// @route   POST /api/payments/webhook
// @access  Public
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;
  const io = req.app.get('socketio'); 

  if (type === 'payment') {
    try {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });

      if (payment && payment.status === 'approved') {
        const metadata = payment.metadata;

        // --- IDEMPOTENCY CHECK (Sin cambios) ---
        const existingBooking = await Booking.findOne({ paymentId: payment.id });
        const existingSale = await Sale.findOne({ paymentId: payment.id });

        if (existingBooking || existingSale) {
          console.log(`Webhook: Payment ${payment.id} already processed. Ignoring.`);
          return res.status(200).send('Webhook received (already processed).');
        }

        // --- Lógica de Reservas (Sin cambios) ---
        if (metadata && metadata.booking_id === 'PENDING' && metadata.booking_data) {
          try {
            const bookingData = metadata.booking_data;
            const createdBooking = await _createBookingFromData(bookingData); 
            createdBooking.paymentId = payment.id;
            await createdBooking.save();
            console.log(`Booking ${createdBooking._id} created and paid via webhook.`);
            if (io) {
                io.emit('booking_update', createdBooking);
            }
          } catch (bookingError) {
             console.error('Webhook booking creation failed:', bookingError.message);
          }
        } else if (metadata && metadata.booking_id) {
          const booking = await Booking.findById(metadata.booking_id);
          if (booking && !booking.isPaid) { 
            booking.isPaid = true;
            booking.status = 'Confirmed';
            booking.paymentMethod = 'Mercado Pago';
            booking.paymentId = payment.id; 
            await booking.save();
            console.log(`Booking ${metadata.booking_id} confirmed and paid via webhook.`);
            if (io) {
                io.emit('booking_update', booking);
            }
          }
        }

        // --- LÓGICA DE VENTAS POS MODIFICADA (Arregla Bug 1) ---
        if (metadata && metadata.sale_items) {
          const saleData = {
            items: metadata.sale_items,
            total: payment.transaction_amount,
            paymentMethod: 'Mercado Pago',
            user: metadata.user_id,
            paymentId: payment.id,
          };
          
          const session = await mongoose.startSession();
          session.startTransaction();
          try {
            for (const item of saleData.items) {
              const product = await Product.findById(item.productId).session(session);
              if (!product || product.stock < item.quantity) {
                throw new Error(`Stock issue for product ${item.productId}`);
              }
              product.stock -= item.quantity;
              await product.save({ session });
            }
            const sale = new Sale(saleData);
            await sale.save({ session });
            await session.commitTransaction();
            console.log(`Sale created and stock updated for payment ${data.id}.`);
            
            // --- ¡NUEVO! Emitimos el objeto completo con el ID único ---
            if (io) {
                io.emit('pos_sale_completed', {
                    ...sale.toObject(), // Enviamos los datos de la venta
                    posSaleId: metadata.posSaleId // Enviamos el ID único
                });
            }
            // --- FIN DEL CAMBIO ---

          } catch (saleError) {
            await session.abortTransaction();
            console.error('Webhook sale creation failed:', saleError.message);
          } finally {
            session.endSession();
          }
        }
      }
      res.status(200).send('Webhook received');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  } else {
    res.status(200).send('Event type not "payment", ignored.');
  }
};

module.exports = {
  createPaymentPreference,
  receiveWebhook,
};
