const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Create a Mercado Pago payment preference
// @route   POST /api/payments/create-preference
// @access  Public / Operator
const createPaymentPreference = async (req, res) => {
  const { items, payer, metadata } = req.body;

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

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
    back_urls: {
      success: `${process.env.CLIENT_URL}/payment-success`,
      failure: `${process.env.CLIENT_URL}/payment-failure`,
      pending: `${process.env.CLIENT_URL}/payment-pending`,
    },
    auto_return: 'approved',
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
  const io = req.app.get('socketio'); // Obtenemos socket.io

  if (type === 'payment') {
    try {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });

      if (payment && payment.status === 'approved') {
        const metadata = payment.metadata;

        // ----------------------------------------------------
        // Lógica de Reservas (Modificada para auto-creación)
        // ----------------------------------------------------
        if (metadata && metadata.booking_id === 'PENDING' && metadata.booking_data) {
          
          // NOTA: Esta lógica asume que booking_data viene en los metadatos
          // (Lo cual implementamos en TimeSlotFinder.jsx)
          try {
            const bookingData = metadata.booking_data;
            
            // (Podríamos añadir validación de conflicto aquí, pero asumimos que la pref. es de corta duración)
            
            const booking = new Booking({
              court: bookingData.courtId,
              user: bookingData.user,
              startTime: bookingData.startTime,
              endTime: bookingData.endTime,
              price: bookingData.totalPrice, // Asegúrate que el precio venga
              status: 'Confirmed',
              isPaid: true,
              paymentMethod: 'Mercado Pago',
            });
            const createdBooking = await booking.save();
            console.log(`Booking ${createdBooking._id} created and paid via webhook.`);
            
            io.emit('booking_update', createdBooking);

          } catch (bookingError) {
             console.error('Webhook booking creation failed:', bookingError.message);
          }

        // Lógica de Reservas (Existente - por si acaso)
        } else if (metadata && metadata.booking_id) {
          const booking = await Booking.findById(metadata.booking_id);
          if (booking) {
            booking.isPaid = true;
            booking.status = 'Confirmed';
            booking.paymentMethod = 'Mercado Pago';
            await booking.save();
            console.log(`Booking ${metadata.booking_id} confirmed and paid.`);
            
            io.emit('booking_update', booking);
          }
        }

        // ----------------------------------------------------
        // Lógica de Ventas POS (Modificada para emitir socket)
        // ----------------------------------------------------
        if (metadata && metadata.sale_items) {
          const saleData = {
            items: metadata.sale_items,
            total: payment.transaction_amount,
            paymentMethod: 'Mercado Pago',
            user: metadata.user_id,
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
            
            // --- ¡AQUÍ ESTÁ LA MAGIA! ---
            // Emitimos el evento al frontend (PosPage)
            io.emit('pos_sale_completed', sale);
            // -----------------------------

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
