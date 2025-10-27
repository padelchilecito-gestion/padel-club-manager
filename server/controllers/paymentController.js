const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Setting = require('../models/Setting'); // <-- IMPORTAR SETTING
const mongoose = require('mongoose');
const { format } = require('date-fns'); // <-- IMPORTAR FORMAT

// @desc    Create a Mercado Pago payment preference (PARA CHECKOUT WEB)
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
    metadata: metadata, // metadata: { booking_id: "..." }
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

// --- NUEVA FUNCIÓN PARA CREAR QR DINÁMICO ---
// @desc    Create a Mercado Pago QR Order for a specific booking
// @route   POST /api/payments/create-qr-order
// @access  Private/Admin
const createBookingQROrder = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  // Validar IDs de entorno
  if (!process.env.MERCADOPAGO_USER_ID || !process.env.MERCADOPAGO_STORE_ID) {
    console.error('Error: MERCADOPAGO_USER_ID y MERCADOPAGO_STORE_ID deben estar configurados.');
    return res.status(500).json({ message: 'Error de configuración del servidor.' });
  }

  try {
    // 1. Obtener datos de la reserva
    const booking = await Booking.findById(bookingId).populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'Esta reserva ya fue pagada.' });
    }
    
    // 2. Obtener nombre del club desde Settings
    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    // 3. Crear la Orden QR en Mercado Pago
    const orderData = {
      external_reference: bookingId, // Usamos external_reference para identificar la reserva
      title: `Reserva de Turno - ${clubName}`,
      description: `Pago de la reserva para ${booking.user.name} ${booking.user.lastName || ''}`,
      notification_url: `${baseUrl}/api/payments/webhook?source_news=webhooks`,
      total_amount: booking.price,
      items: [
        {
          title: `Turno ${format(new Date(booking.startTime), 'dd/MM HH:mm')}`,
          unit_price: booking.price,
          quantity: 1,
          total_amount: booking.price,
          currency_id: 'ARS',
        }
      ],
      // Definir un tiempo de expiración para el QR (ej. 30 minutos)
      expiration_date: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    };
    
    // Usamos la API de Órdenes de Tienda (In-Store)
    const url = `/instore/orders/qr/seller/collectors/${process.env.MERCADOPAGO_USER_ID}/stores/${process.env.MERCADOPAGO_STORE_ID}/pos/1/orders`;
    
    const mpResponse = await client.post(url, orderData);

    // Devolvemos la data del QR al frontend
    res.json({ qr_data: mpResponse.qr_data });

  } catch (error) {
    console.error('Error creating Mercado Pago QR order:', error?.data || error.message);
    res.status(500).json({ message: 'Failed to create QR order.' });
  }
};

// --- WEBHOOK MODIFICADO ---
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
        let paymentMethod;

        // --- LÓGICA MEJORADA ---
        // A. Chequear si es un PAGO QR (identificado por external_reference)
        if (payment.external_reference) {
          booking = await Booking.findById(payment.external_reference);
          paymentMethod = 'QR Mercado Pago'; // El método de pago que querías
        
        // B. Chequear si es un PAGO WEB (identificado por metadata)
        } else if (payment.metadata && payment.metadata.booking_id) {
          booking = await Booking.findById(payment.metadata.booking_id);
          paymentMethod = 'Mercado Pago Web'; // Diferenciamos del QR
        }
        // --- FIN LÓGICA ---

        // Si encontramos una reserva por cualquiera de los métodos
        if (booking && !booking.isPaid) { // Solo actualizar si no estaba paga
          booking.isPaid = true;
          booking.status = 'Confirmed';
          booking.paymentMethod = paymentMethod;
          await booking.save();
          console.log(`✅ Booking ${booking._id} confirmed and paid via ${paymentMethod}.`);
          
          // Emitir evento por socket
          const io = req.app.get('socketio');
          io.emit('booking_update', booking);
        }

        // --- Lógica de Venta POS (Tu código original) ---
        if (payment.metadata && payment.metadata.sale_items) {
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
            await session.abortTransaction();
            console.error('Webhook sale creation failed:', saleError.message);
          } finally {
            session.endSession();
          }
        }
        // --- Fin Lógica Venta POS ---
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
  createBookingQROrder, // <-- EXPORTAR NUEVA FUNCIÓN
};
