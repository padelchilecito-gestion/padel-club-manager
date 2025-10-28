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


// --- FUNCIÓN createBookingPreferenceQR MODIFICADA ---
const createBookingPreferenceQR = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  try {
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
    if (booking.isPaid) return res.status(400).json({ message: 'Esta reserva ya fue pagada.' });

    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    // --- CAMBIOS EN EL CUERPO DE LA PREFERENCIA ---
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
        payment_type: 'qr_preference' 
      }, 
      notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
      
      // --- 1. AÑADIDO: Indicar propósito de pago desde la wallet ---
      purpose: 'wallet_purchase', 
      
      // --- 2. ELIMINADO: Bloque 'payment_methods' que excluía tipos ---
      // payment_methods: { ... } // <= SE QUITÓ ESTE BLOQUE

      // Mantenemos la expiración
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
    // --- FIN DE CAMBIOS ---

    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceBody });

    // Extraer info del QR (ahora esperamos que point_of_interaction no sea null)
    const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCode = result.point_of_interaction?.transaction_data?.qr_code;

    // Log para ver qué devolvió MP en point_of_interaction
    console.log("ℹ️ Respuesta MP, point_of_interaction:", result.point_of_interaction); 

    if (!qrCodeBase64 && !qrCode) {
      console.error('❌ MP Preference created, but QR data not found in response:', result);
      throw new Error('No se encontró información del QR en la respuesta de Mercado Pago.');
    }

    console.log(`✅ Preferencia QR creada para booking ${bookingId}.`);
    res.json({ 
        qr_code_base64: qrCodeBase64,
        qr_code: qrCode 
    });

  } catch (error) {
    console.error(`❌ Error creating Mercado Pago Preference QR for booking ${bookingId}:`, error?.response?.data || error.message);
    res.status(500).json({ message: 'Failed to create QR preference.' });
  }
};


// --- receiveWebhook (sin cambios respecto a la versión anterior) ---
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    try {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });

      if (payment && payment.status === 'approved') {
        let booking;
        let paymentMethod = 'Mercado Pago'; // Default

        if (payment.metadata && payment.metadata.booking_id) {
          booking = await Booking.findById(payment.metadata.booking_id);
          if (payment.payment_method_id === 'account_money' || payment.point_of_interaction?.type === 'POINT_OF_INTERACTION') {
             paymentMethod = 'QR Mercado Pago'; 
          } else {
             paymentMethod = 'MP (' + (payment.payment_method_id || 'Web') + ')';
          }
        }
        else if (payment.metadata && payment.metadata.sale_items) { 
            console.log('Procesando pago de Venta POS...');
            const saleData = { 
              items: payment.metadata.sale_items,
              total: payment.transaction_amount,
              paymentMethod: 'Mercado Pago',
              user: payment.metadata.user_id,
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
            } catch (saleError) { 
               console.error('Webhook sale creation failed:', saleError.message);
               await session.abortTransaction();
            } finally { session.endSession(); }
            booking = null; // Evita que se actualice un booking si es venta POS
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
  createBookingPreferenceQR, // Asegúrate que esta se exporta
  receiveWebhook,
};
