// server/controllers/paymentController.js - VERSIÓN CORREGIDA
const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const axios = require('axios'); // Aunque axios ya no se usa aquí, lo mantenemos por si acaso
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
      external_reference: bookingId.toString(),
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
// 2. QR DINÁMICO CON PREFERENCE (Solución Definitiva)
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

    const clubName = (await Setting.findOne({ key: 'clubName' }))?.value || 'Padel Club';

    const preference = new Preference(client);
    const preferenceData = {
      items: [
        {
          title: `Turno en ${clubName}`,
          description: `Reserva de ${booking.court.name} para el ${format(new Date(booking.startTime), 'dd/MM HH:mm')}hs`,
          quantity: 1,
          unit_price: booking.price,
          currency_id: 'ARS'
        }
      ],
      external_reference: bookingId.toString(),
      notification_url: `${baseUrl}/api/payments/webhook`,
    };
    
    // Crear la preferencia
    const response = await preference.create({ body: preferenceData });

    // ¡ESTE ES EL CAMBIO!
    // No buscamos un QR, solo devolvemos el link de pago (init_point)
    // El frontend se encargará de convertir este link en un QR.
    console.log(`✅ Preferencia (para QR) generada para booking: ${bookingId}`);

    res.json({
      init_point: response.init_point, // Devolvemos la URL
      amount: booking.price,
    });

  } catch (error) {
    console.error('❌ Error al crear QR con Preference:', error);
    res.status(500).json({ 
      message: 'Error al generar el código QR',
      error: error.message
    });
  }
};


// ==========================================
// 3. WEBHOOK PARA CHECKOUT PRO (payment)
// ==========================================
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;

  console.log('🔔 Webhook unificado recibido:', { type, data, query: req.query });

  if (type === 'payment') {
    const paymentId = data?.id;
    if (!paymentId) {
      return res.status(200).send('Ignored: No payment ID');
    }

    try {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: paymentId });

      if (paymentData.status !== 'approved') {
        return res.status(200).send('Payment not approved yet');
      }

      const bookingId = paymentData.external_reference;
      if (!bookingId) {
        return res.status(200).send('No external_reference in payment');
      }

      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(200).send('Booking not found');
      }
      if (booking.isPaid) {
        return res.status(200).send('Booking already paid');
      }

      booking.isPaid = true;
      booking.status = 'Confirmed';
      booking.paymentMethod = 'Mercado Pago'; // Unificado
      await booking.save();

      console.log(`✅ Booking ${bookingId} marcado como pagado (desde Webhook)`);

      const io = req.app.get('socketio');
      if (io) {
        io.emit('booking_update', booking);
      }

      return res.status(200).send('OK');

    } catch (error) {
      console.error('❌ Error processing payment webhook:', error);
      return res.status(500).send('Error processing payment');
    }
  }

  // Si no es de tipo 'payment', se ignora. Los QR via Preference notifican con 'payment'.
  return res.status(200).send('Ignored: Not a payment notification');
};


// ==========================================
// 4. WEBHOOK PARA QR DINÁMICO (merchant_order) - Obsoleto, se mantiene por seguridad
// ==========================================
const receiveWebhookQR = async (req, res) => {
  console.log('⚠️  Webhook QR (obsoleto) recibido. Redirigiendo al webhook principal.');
  return receiveWebhook(req, res);
};

module.exports = {
  createBookingPreference,
  createBookingQRDynamic,
  receiveWebhook,
  receiveWebhookQR
};
