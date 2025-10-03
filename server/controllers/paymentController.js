const mercadopago = require('../config/mercadopago');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { logActivity } = require('../utils/logActivity');

// @desc    Create a Mercado Pago payment preference
// @route   POST /api/payments/create-preference
// @access  Public / Operator
const createPaymentPreference = async (req, res) => {
  const { items, payer, metadata } = req.body;

  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  const preference = {
    items: items.map(item => ({
      title: item.title,
      unit_price: item.unit_price,
      quantity: item.quantity,
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

        if (metadata.booking_id_placeholder) {
          // This flow is for when the booking doesn't exist yet.
          // It creates the booking upon successful payment.
          const bookingData = metadata.booking_id_placeholder;

          // First, re-check for conflicts in case the slot was taken
          // while the user was on the Mercado Pago page.
          const conflictingBooking = await Booking.findOne({
            court: bookingData.courtId,
            status: { $ne: 'Cancelled' },
            $or: [
              { startTime: { $lt: new Date(bookingData.endTime), $gte: new Date(bookingData.startTime) } },
            ],
          });

          if (conflictingBooking) {
            console.warn(`Webhook: Conflicting booking found for a paid reservation. Payment ID: ${data.id}. Needs manual refund.`);
            // In a real app, you would flag this for manual intervention or trigger an automatic refund.
            return res.status(200).send('Webhook received, conflict detected.');
          }

          const court = await Court.findById(bookingData.courtId);
          const price = (new Date(bookingData.endTime) - new Date(bookingData.startTime)) / (1000 * 60 * 60) * court.pricePerHour;

          const booking = new Booking({
            ...bookingData,
            price,
            isPaid: true,
            status: 'Confirmed',
            paymentMethod: 'Mercado Pago',
          });

          const createdBooking = await booking.save();
          console.log(`Booking ${createdBooking._id} created and paid via webhook.`);

          const io = req.app.get('socketio');
          io.emit('booking_update', createdBooking);

          const logDetails = `Booking created via MP for ${booking.user.name} on court '${court.name}'.`;
          await logActivity(null, 'BOOKING_CREATED', logDetails);

        } else if (metadata.sale_items) {
          const saleData = {
            items: metadata.sale_items,
            total: payment.body.transaction_amount,
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

            const saleUser = { id: metadata.user_id, username: metadata.username };
            const logDetails = `Sale of ${saleData.total.toFixed(2)} ARS (Mercado Pago) registered by user '${saleUser.username}'.`;
            await logActivity(saleUser, 'SALE_REGISTERED', logDetails);

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