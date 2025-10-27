const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const mongoose = require('mongoose');
const { format } = require('date-fns');

// --- createPaymentPreference (sin cambios) ---
const createPaymentPreference = async (req, res) => {
  const { items, payer, metadata } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const preferenceBody = {
    items: items.map(item => ({
      title: item.title, unit_price: Number(item.unit_price), quantity: Number(item.quantity), currency_id: 'ARS',
    })),
    payer: { name: payer.name, email: payer.email },
    back_urls: {
      success: `${process.env.CLIENT_URL}/payment-success`, failure: `${process.env.CLIENT_URL}/payment-failure`, pending: `${process.env.CLIENT_URL}/payment-pending`,
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

// --- FUNCIÓN DE QR MODIFICADA ---
const createBookingQROrder = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
  const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const mpUserId = process.env.MERCADOPAGO_USER_ID;
  const mpStoreId = process.env.MERCADOPAGO_STORE_ID;
  // --- NUEVO: Leer POS ID, default a '1' ---
  const mpPosId = process.env.MERCADOPAGO_POS_ID || '1'; 

  // Validar IDs de entorno
  if (!mpAccessToken || !mpUserId || !mpStoreId) {
    console.error('❌ Error: Faltan variables de entorno de Mercado Pago (TOKEN, USER_ID, STORE_ID).');
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }
  // Log para verificar IDs leídos
  console.log(`ℹ️ Usando MP IDs -> User: ${mpUserId}, Store: ${mpStoreId}, POS: ${mpPosId}`);

  try {
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
    if (booking.isPaid) return res.status(400).json({ message: 'Esta reserva ya fue pagada.' });
    
    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    const orderData = {
      external_reference: bookingId,
      title: `Reserva de Turno - ${clubName}`,
      description: `Pago de la reserva para ${booking.user.name} ${booking.user.lastName || ''}`,
      notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
      total_amount: booking.price,
      items: [{
        title: `Turno ${format(new Date(booking.startTime), 'dd/MM HH:mm')}`,
        unit_price: booking.price, quantity: 1, total_amount: booking.price, currency_id: 'ARS',
      }],
      expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
    
    // --- URL CON POS ID VARIABLE ---
    const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${mpUserId}/stores/${mpStoreId}/pos/${mpPosId}/orders`;
    
    // --- Log de la URL exacta ---
    console.log(`📞 Llamando a MP API: POST ${url}`);
    
    const mpResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${mpAccessToken}` },
      body: JSON.stringify(orderData)
    });

    const mpResult = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('❌ Error de Mercado Pago al crear QR:', mpResult); // Log más detallado
      throw new Error(mpResult.message || 'Error al contactar con Mercado Pago');
    }
    
    console.log('✅ QR Creado exitosamente por MP.');
    res.json({ qr_data: mpResult.qr_data });

  } catch (error) {
    console.error(`❌ Error creating Mercado Pago QR order for booking ${bookingId}:`, error.message);
    res.status(500).json({ message: 'Failed to create QR order.' });
  }
};

// --- receiveWebhook (sin cambios) ---
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;
  if (type === 'payment') {
    try {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });
      if (payment && payment.status === 'approved') {
        let booking;
        let paymentMethod;
        if (payment.external_reference) {
          booking = await Booking.findById(payment.external_reference);
          paymentMethod = 'QR Mercado Pago';
        } else if (payment.metadata && payment.metadata.booking_id) {
          booking = await Booking.findById(payment.metadata.booking_id);
          paymentMethod = 'Mercado Pago Web';
        }
        if (booking && !booking.isPaid) {
          booking.isPaid = true;
          booking.status = 'Confirmed';
          booking.paymentMethod = paymentMethod;
          await booking.save();
          console.log(`✅ Booking ${booking._id} confirmed and paid via ${paymentMethod}.`);
          const io = req.app.get('socketio');
          io.emit('booking_update', booking);
        }
        if (payment.metadata && payment.metadata.sale_items) { /* Tu lógica POS */ }
      }
      res.status(200).send('Webhook received');
    } catch (error) {
      console.error('Error processing webhook:', error);
      res.status(500).send('Error processing webhook');
    }
  } else { res.status(200).send('Event type not "payment", ignored.'); }
};

module.exports = { createPaymentPreference, receiveWebhook, createBookingQROrder };
