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


// --- FUNCIÓN createBookingPreferenceQR SIMPLIFICADA ---
// Devuelve el init_point en lugar de intentar extraer QR data
const createBookingPreferenceQR = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  try {
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
    if (booking.isPaid) return res.status(400).json({ message: 'Esta reserva ya fue pagada.' });

    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    const preferenceBody = {
      items: [
        {
          title: `Reserva Turno ${format(new Date(booking.startTime), 'dd/MM HH:mm')} - ${clubName}`,
          description: `Pago para ${booking.user.name} ${booking.user.lastName || ''}`,
          unit_price: booking.price,
          quantity: 1,
          currency_id: 'ARS',
        }
      ],
      metadata: {
        booking_id: bookingId,
        payment_type: 'web_preference' // Cambiamos tipo para claridad
      },
      notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
      // Opcional: Redirigir tras pago en la nueva pestaña
      back_urls: {
         success: `${process.env.CLIENT_URL}/payment-success?bookingId=${bookingId}`, // Puedes crear esta página si quieres
         failure: `${process.env.CLIENT_URL}/payment-failure?bookingId=${bookingId}`,
         pending: `${process.env.CLIENT_URL}/payment-pending?bookingId=${bookingId}`,
      },
       auto_return: 'approved', // Regresa automáticamente si el pago es aprobado
      // Ya no necesitamos purpose ni excluír métodos
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceBody });

    // --- DEVOLVEMOS SOLO EL init_point ---
    const initPoint = result.sandbox_init_point || result.init_point;
    console.log(`✅ Preferencia Web creada para booking ${bookingId}. Init Point: ${initPoint}`);
    
    if (!initPoint) {
       console.error('❌ MP Preference created, but init_point not found:', result);
       throw new Error('No se recibió el link de pago de Mercado Pago.');
    }
    
    res.json({
        init_point: initPoint // Devolvemos el link
    });

  } catch (error) {
    console.error(`❌ Error creating Mercado Pago Web Preference for booking ${bookingId}:`, error?.response?.data || error.message);
    res.status(500).json({ message: 'Failed to create payment preference.' });
  }
};


// --- receiveWebhook (Sin cambios necesarios aquí) ---
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;
  if (type === 'payment') {
    try {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });
      if (payment && payment.status === 'approved') {
        let booking;
        let paymentMethod = 'Mercado Pago';
        if (payment.metadata && payment.metadata.booking_id) {
          booking = await Booking.findById(payment.metadata.booking_id);
          // Mejoramos el nombre del método
          if (payment.payment_method_id === 'account_money' || payment.payment_type_id === 'account_money') { 
            paymentMethod = 'MP Dinero Cuenta'; 
          } else if (payment.payment_type_id === 'credit_card') { 
            paymentMethod = 'MP Tarj. Crédito';
          } else if (payment.payment_type_id === 'debit_card') { 
            paymentMethod = 'MP Tarj. Débito';
          } else if (payment.payment_type_id === 'bank_transfer') {
            paymentMethod = 'MP Transferencia';
          } else {
            paymentMethod = `MP (${payment.payment_method_id || 'Otro'})`;
          }
        }
        else if (payment.metadata && payment.metadata.sale_items) { 
            console.log('Procesando pago de Venta POS...');
            const saleData = { /* ... */ }; // Tu lógica POS
            const session = await mongoose.startSession();
            session.startTransaction();
            try { /* ... Tu lógica POS ... */ await session.commitTransaction(); } 
            catch (saleError) { /* ... */ await session.abortTransaction(); } 
            finally { session.endSession(); }
            booking = null; 
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
  createBookingPreferenceQR,
  receiveWebhook,
};
