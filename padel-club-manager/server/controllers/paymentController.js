const mercadopago = require('../config/mercadopago');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');

// @desc    Create a Mercado Pago payment preference
// @route   POST /api/payments/create-preference
// @access  Public / Operator
const createPaymentPreference = async (req, res) => {
  const { items, payer, metadata } = req.body; // metadata can contain bookingId or sale details

  // Base URL should come from .env
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  const preference = {
    items: items.map(item => ({
      title: item.title,
      unit_price: item.unit_price,
      quantity: item.quantity,
      currency_id: 'ARS', // Assuming Argentinian Pesos
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
    metadata: metadata, // Pass our internal IDs here
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    res.json({ id: response.body.id, init_point: response.body.init_point });
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

  if (type === 'payment') {
    try {
      const payment = await mercadopago.payment.findById(data.id);
      const metadata = payment.body.metadata;

      if (payment.body.status === 'approved') {

        // Check if it's a booking payment
        if (metadata.booking_id) {
          const booking = await Booking.findById(metadata.booking_id);
          if (booking) {
            booking.isPaid = true;
            booking.status = 'Confirmed';
            booking.paymentMethod = 'Mercado Pago';
            await booking.save();
            console.log(`Booking ${metadata.booking_id} confirmed and paid.`);

            // Emit a real-time event
            const io = req.app.get('socketio');
            io.emit('booking_update', booking);
          }
        }

        // Check if it's a POS sale payment
        if (metadata.sale_items) {
          // This is a simplified flow. A real-world scenario might pre-create the sale as 'Pending'.
          // Here, we create the sale and update stock upon payment confirmation.
          const saleData = {
            items: metadata.sale_items,
            total: payment.body.transaction_amount,
            paymentMethod: 'Mercado Pago',
            user: metadata.user_id, // We must pass the operator's ID in metadata
          };

          // Using the same atomic transaction logic as in saleController
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