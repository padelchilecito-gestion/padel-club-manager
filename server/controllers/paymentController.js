const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Setting = require('../models/Setting'); // Importar Setting
const mongoose = require('mongoose');
const { format } = require('date-fns'); // Importar format

// --- createPaymentPreference (SIN CAMBIOS, para checkout web general si lo usas) ---
const createPaymentPreference = async (req, res) => {
  // ... (tu código existente)
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


// --- NUEVA FUNCIÓN: Crear Preferencia específica para QR de Reserva ---
// @desc    Create a Mercado Pago Preference focused on QR for a specific booking
// @route   POST /api/payments/create-booking-preference-qr
// @access  Private/Admin
const createBookingPreferenceQR = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  try {
    // 1. Obtener datos de la reserva
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) return res.status(404).json({ message: 'Reserva no encontrada' });
    if (booking.isPaid) return res.status(400).json({ message: 'Esta reserva ya fue pagada.' });

    // 2. Obtener nombre del club desde Settings
    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    // 3. Crear el cuerpo de la Preferencia
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
      // Asociamos la reserva en metadata para identificarla en el webhook
      metadata: { 
        booking_id: bookingId,
        payment_type: 'qr_preference' // Indicador opcional
      }, 
      notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
      // Definimos que el único método de pago sea QR
      // (Esto es una pista para MP, pero puede mostrar otros si el usuario elige)
      payment_methods: {
        excluded_payment_types: [ // Excluimos todo MENOS point_of_interaction con QR
             { id: "credit_card" },
             { id: "debit_card" },
             { id: "prepaid_card" },
             { id: "bank_transfer" },
             { id: "ticket" },
             { id: "atm" }
        ],
        // installments: 1 // Opcional: forzar 1 cuota
      },
      // Expira en 30 minutos (similar a la API In-Store)
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };

    // 4. Crear la preferencia usando el SDK v3
    const preference = new Preference(client);
    const result = await preference.create({ body: preferenceBody });

    // 5. Extraer la información del QR del resultado
    // El SDK v3 suele devolverlo aquí:
    const qrCodeBase64 = result.point_of_interaction?.transaction_data?.qr_code_base64;
    const qrCode = result.point_of_interaction?.transaction_data?.qr_code; // String para escanear

    if (!qrCodeBase64 && !qrCode) {
      console.error('MP Preference created, but QR data not found in response:', result);
      throw new Error('No se encontró información del QR en la respuesta de Mercado Pago.');
    }

    console.log(`✅ Preferencia QR creada para booking ${bookingId}.`);
    // Devolvemos ambos formatos si existen, el frontend usará el que prefiera
    res.json({ 
        qr_code_base64: qrCodeBase64, // Imagen lista para mostrar
        qr_code: qrCode // String para el componente qrcode.react
    });

  } catch (error) {
    console.error(`❌ Error creating Mercado Pago Preference QR for booking ${bookingId}:`, error?.response?.data || error.message);
    res.status(500).json({ message: 'Failed to create QR preference.' });
  }
};


// --- WEBHOOK Ligeramente Modificado ---
// @desc    Receive Mercado Pago webhook notifications
// @route   POST /api/payments/webhook
// @access  Public
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    try {
      const paymentClient = new Payment(client);
      const payment = await paymentClient.get({ id: data.id });

      if (payment && payment.status === 'approved') {
        let booking;
        let paymentMethod = 'Mercado Pago'; // Default

        // Identificar la reserva usando metadata (como antes)
        if (payment.metadata && payment.metadata.booking_id) {
          booking = await Booking.findById(payment.metadata.booking_id);
          // Intentar determinar si fue QR basado en la info del pago
          if (payment.payment_method_id === 'account_money' || payment.point_of_interaction?.type === 'POINT_OF_INTERACTION') {
             paymentMethod = 'QR Mercado Pago'; // O un nombre más específico si prefieres
          } else {
             paymentMethod = 'MP (' + (payment.payment_method_id || 'Web') + ')'; // Ej: MP (credit_card)
          }
        }
        
        // --- Lógica de Venta POS (Tu código original - OJO con metadata!) ---
        // Si usas metadata también para POS, asegúrate que booking_id no interfiera
        else if (payment.metadata && payment.metadata.sale_items) { 
            console.log('Procesando pago de Venta POS...');
             // ... (Tu lógica existente para ventas POS, asegurando que use metadata distinta a booking_id) ...
            const saleData = { /* ... */ };
            const session = await mongoose.startSession();
            session.startTransaction();
            try { /* ... Tu lógica de stock y save ... */
               await session.commitTransaction();
            } catch (saleError) { /* ... Tu manejo de error ... */
               await session.abortTransaction();
            } finally { session.endSession(); }
            // IMPORTANTE: Asegúrate de NO intentar buscar un booking aquí si es una venta POS
            booking = null; // Para evitar que entre en el if de abajo
        }


        // Actualizar la reserva si se encontró y no estaba pagada
        if (booking && !booking.isPaid) {
          booking.isPaid = true;
          booking.status = 'Confirmed';
          booking.paymentMethod = paymentMethod; // Método de pago detectado
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
  createPaymentPreference,     // La original
  createBookingPreferenceQR, // La nueva para QR
  receiveWebhook,
};
