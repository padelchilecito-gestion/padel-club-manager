// server/controllers/paymentController.js - VERSIÓN CORREGIDA
const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const axios = require('axios');
const { format } = require('date-fns');

// ==========================================
// 1. CHECKOUT PRO - BOTÓN WEB (Preference)
// ==========================================
const createBookingPreference = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  try {
    const booking = await Booking.findById(bookingId).populate('court');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'Esta reserva ya fue pagada' });
    }

    const preference = new Preference(client);
    const preferenceData = {
      items: [
        {
          title: `Reserva de cancha para el ${format(new Date(booking.startTime), 'dd/MM/yyyy HH:mm')}hs`,
          quantity: 1,
          unit_price: booking.price,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/payment-success`,
        failure: `${process.env.FRONTEND_URL}/payment-failure`,
        pending: ''
      },
      auto_return: 'approved',
      external_reference: bookingId.toString(),
      notification_url: `${baseUrl}/api/payments/webhook`,
    };

    const response = await preference.create({ body: preferenceData });
    
    res.json({
      id: response.id,
      init_point: response.init_point
    });

  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    res.status(500).json({ 
      message: 'Error al procesar el pago',
      error: error.message 
    });
  }
};

// ==========================================
// 2. QR DINÁMICO SIMPLIFICADO (Sin Store/POS)
// ==========================================
const createBookingQRDynamic = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  try {
    const booking = await Booking.findById(bookingId).populate('court');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'Esta reserva ya fue pagada' });
    }

    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) {
      throw new Error('Access Token de Mercado Pago no configurado');
    }

    // Obtener USER_ID desde el Access Token (método público)
    const meResponse = await axios.get('https://api.mercadopago.com/users/me', {
      headers: { 'Authorization': `Bearer ${mpAccessToken}` }
    });
    const userId = meResponse.data.id;

    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    // Usar un external_pos_id fijo y único para tu club
    const externalPosId = 'TURNOS_PADEL_01';

    const qrOrderData = {
      external_reference: bookingId,
      title: `Turno ${format(new Date(booking.startTime), 'dd/MM HH:mm')}`,
      description: `${booking.court?.name || 'Cancha'} - ${clubName}`,
      notification_url: `${baseUrl}/api/payments/webhook-qr`,
      total_amount: booking.price,
      items: [
        {
          sku_number: `BOOKING_${bookingId}`,
          category: 'marketplace',
          title: `Turno ${booking.court?.name || 'Cancha'}`,
          description: `Reserva ${format(new Date(booking.startTime), 'dd/MM HH:mm')}`,
          unit_price: booking.price,
          quantity: 1,
          unit_measure: 'unit',
          total_amount: booking.price
        }
      ]
    };

    // API simplificada que NO requiere Store ID
    const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/qrs`;
    
    const qrResponse = await axios.post(url, qrOrderData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${mpAccessToken}`
      }
    });

    if (!qrResponse.data || !qrResponse.data.qr_data) {
      throw new Error('Mercado Pago no devolvió los datos del QR');
    }

    console.log(`✅ QR generado para booking: ${bookingId}`);

    res.json({
      qr_data: qrResponse.data.qr_data,
      amount: booking.price,
      in_store_order_id: qrResponse.data.in_store_order_id
    });

  } catch (error) {
    console.error('❌ Error creating QR:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Error al generar QR dinámico',
      error: error.response?.data?.message || error.message 
    });
  }
};

const receiveWebhook = async (req, res) => {
  const { body, query } = req;
  const topic = body?.topic || query?.topic;

  if (topic === 'payment') {
    const paymentId = body?.data?.id || query?.id;
    if (!paymentId) {
      return res.status(200).send('No payment ID provided');
    }

    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status === 'approved') {
        const bookingId = paymentData.external_reference;
        const booking = await Booking.findById(bookingId);

        if (booking && !booking.isPaid) {
          booking.isPaid = true;
          booking.status = 'Confirmed';
          booking.paymentMethod = 'Mercado Pago';
          await booking.save();

          const io = req.app.get('socketio');
          io.emit('booking_update', booking);
        }
      }
      res.status(200).send('OK');
    } catch (error) {
      console.error('Error processing payment webhook:', error);
      res.status(500).send('Error processing payment');
    }
  } else {
    res.status(200).send('Unhandled topic');
  }
};

const receiveWebhookQR = receiveWebhook;

module.exports = {
  createBookingPreference,    // Para botón web
  createBookingQRDynamic,     // Para QR turnos
  receiveWebhook,             // Webhook checkout web
  receiveWebhookQR            // Webhook QR
};
