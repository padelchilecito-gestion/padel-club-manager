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

    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    const preference = new Preference(client);
    const preferenceData = {
      items: [
        {
          title: `Turno ${booking.court?.name || 'Cancha'} - ${format(new Date(booking.startTime), 'dd/MM HH:mm')}`,
          quantity: 1,
          unit_price: booking.price,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: `${baseUrl}/payment-success`,
        failure: `${baseUrl}/payment-failure`,
        pending: `${baseUrl}/payment-pending`
      },
      auto_return: 'approved',
      external_reference: bookingId,
      notification_url: `${baseUrl}/api/payments/webhook`,
      metadata: {
        booking_id: bookingId,
        club_name: clubName
      }
    };

    const response = await preference.create({ body: preferenceData });
    
    res.json({
      id: response.id,
      init_point: response.init_point,
      sandbox_init_point: response.sandbox_init_point
    });

  } catch (error) {
    console.error('❌ Error creating preference:', error);
    res.status(500).json({ 
      message: 'Error al crear preferencia de pago',
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

// ==========================================
// 3. WEBHOOK PARA CHECKOUT PRO (payment)
// ==========================================
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;

  console.log('🔔 Webhook recibido:', { type, data });

  if (type !== 'payment' || !data?.id) {
    return res.status(200).send('Ignored');
  }

  try {
    const payment = new Payment(client);
    const paymentData = await payment.get({ id: data.id });

    console.log('💳 Pago encontrado:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference
    });

    if (paymentData.status !== 'approved') {
      return res.status(200).send('Payment not approved yet');
    }

    const bookingId = paymentData.external_reference;
    if (!bookingId) {
      return res.status(200).send('No external_reference');
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(200).send('Booking not found');
    }

    if (booking.isPaid) {
      return res.status(200).send('Already paid');
    }

    booking.isPaid = true;
    booking.status = 'Confirmed';
    booking.paymentMethod = 'Mercado Pago Web';
    await booking.save();

    console.log(`✅ Booking ${bookingId} marcado como pagado (Web)`);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_update', booking);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(200).send('Error');
  }
};

// ==========================================
// 4. WEBHOOK PARA QR DINÁMICO (merchant_order)
// ==========================================
const receiveWebhookQR = async (req, res) => {
  const notificationData = req.body;
  const topic = notificationData?.topic || req.query?.topic;
  
  let orderId = null;
  if (notificationData?.resource) {
    const urlParts = notificationData.resource.split('/');
    orderId = urlParts[urlParts.length - 1];
  } else if (req.query?.id) {
    orderId = req.query.id;
  }
  
  console.log('🔔 Webhook QR:', { topic, orderId });

  if (topic !== 'merchant_order' || !orderId) {
    return res.status(200).send('Ignored');
  }

  try {
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    const orderResponse = await axios.get(
      `https://api.mercadopago.com/merchant_orders/${orderId}`,
      { headers: { 'Authorization': `Bearer ${mpAccessToken}` } }
    );
    
    const order = orderResponse.data;

    if (order.status !== 'closed' || order.paid_amount < order.total_amount) {
      return res.status(200).send('Order not fully paid');
    }

    const externalRef = order.external_reference;
    if (!externalRef) {
      return res.status(200).send('No external_reference');
    }

    const booking = await Booking.findById(externalRef);
    if (!booking) {
      return res.status(200).send('Booking not found');
    }

    if (booking.isPaid) {
      return res.status(200).send('Already paid');
    }

    let paymentMethod = 'QR Mercado Pago';
    const firstPayment = order.payments?.find(p => p.status === 'approved');
    if (firstPayment) {
      const type = firstPayment.payment_type_id || 'unknown';
      if (type === 'account_money') paymentMethod = 'QR MP Saldo';
      else if (type === 'credit_card') paymentMethod = 'QR MP Crédito';
      else if (type === 'debit_card') paymentMethod = 'QR MP Débito';
    }

    booking.isPaid = true;
    booking.status = 'Confirmed';
    booking.paymentMethod = paymentMethod;
    await booking.save();

    console.log(`✅ Booking ${booking._id} pagado vía ${paymentMethod}`);

    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_update', booking);
    }

    res.status(200).send('OK');

  } catch (error) {
    console.error('❌ Error processing QR webhook:', error);
    res.status(200).send('Error');
  }
};

module.exports = {
  createBookingPreference,    // Para botón web
  createBookingQRDynamic,     // Para QR turnos
  receiveWebhook,             // Webhook checkout web
  receiveWebhookQR            // Webhook QR
};
