// server/controllers/paymentController.js - VERSIÓN ACTUALIZADA
const { Preference, Payment } = require('mercadopago');
const client = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Setting = require('../models/Setting');
const Sale = require('../models/Sale'); // <-- AÑADIR ESTE MODELO
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
      // --- CAMBIO: Añadir prefijo para el webhook ---
      external_reference: `booking_${bookingId.toString()}`,
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
// 2. QR DINÁMICO CON PREFERENCE (Para Reservas)
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
      // --- CAMBIO: Añadir prefijo para el webhook ---
      external_reference: `booking_${bookingId.toString()}`,
      notification_url: `${baseUrl}/api/payments/webhook`,
    };
    
    const response = await preference.create({ body: preferenceData });

    console.log(`✅ Preferencia (para QR Reserva) generada para booking: ${bookingId}`);

    res.json({
      init_point: response.init_point,
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
// 3. NUEVA FUNCIÓN: QR PARA POS
// ==========================================
const createPosPreference = async (req, res) => {
  const { cart, totalAmount } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  if (!cart || cart.length === 0 || !totalAmount) {
    return res.status(400).json({ message: 'Datos de la venta inválidos' });
  }

  try {
    const clubName = (await Setting.findOne({ key: 'clubName' }))?.value || 'Padel Club';

    // 1. Crear la venta en estado 'Pending'
    const newSale = new Sale({
      items: cart.map(item => ({
        product: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: totalAmount,
      paymentMethod: 'Mercado Pago (QR)',
      status: 'Pending',
      user: req.user._id, // El admin que está cobrando
    });
    await newSale.save();

    // 2. Preparar items para Mercado Pago
    const mpItems = cart.map(item => ({
      title: item.name,
      quantity: item.quantity,
      unit_price: item.price,
      currency_id: 'ARS'
    }));

    // 3. Crear la preferencia de pago
    const preference = new Preference(client);
    const preferenceData = {
      items: mpItems,
      // --- CAMBIO: Usar prefijo 'sale_' y el ID de la nueva venta ---
      external_reference: `sale_${newSale._id.toString()}`,
      notification_url: `${baseUrl}/api/payments/webhook`,
      metadata: {
        sale_id: newSale._id.toString(),
        club_name: clubName
      }
    };

    const response = await preference.create({ body: preferenceData });

    console.log(`✅ Preferencia (para QR POS) generada para Venta: ${newSale._id}`);

    res.json({
      init_point: response.init_point,
      amount: totalAmount,
      saleId: newSale._id // Devolvemos el ID de la venta
    });

  } catch (error) {
    console.error('❌ Error al crear preferencia de POS:', error);
    res.status(500).json({ 
      message: 'Error al generar el QR para la venta',
      error: error.message
    });
  }
};

// ==========================================
// 4. WEBHOOK UNIFICADO (Actualizado)
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

      const externalReference = paymentData.external_reference;
      if (!externalReference) {
        return res.status(200).send('No external_reference in payment');
      }

      const io = req.app.get('socketio');

      // --- LÓGICA DE WEBHOOK ACTUALIZADA ---
      if (externalReference.startsWith('booking_')) {
        
        const bookingId = externalReference.split('_')[1];
        const booking = await Booking.findById(bookingId);
        
        if (booking && !booking.isPaid) {
          booking.isPaid = true;
          booking.status = 'Confirmed';
          booking.paymentMethod = 'Mercado Pago';
          await booking.save();
          console.log(`✅ Booking ${bookingId} marcado como pagado (desde Webhook)`);
          if (io) io.emit('booking_update', booking);
        }

      } else if (externalReference.startsWith('sale_')) {
        
        const saleId = externalReference.split('_')[1];
        const sale = await Sale.findById(saleId);

        if (sale && sale.status !== 'Completed') {
          sale.status = 'Completed';
          sale.paymentId = paymentId.toString(); // Guardar ID de pago de MP
          await sale.save();
          console.log(`✅ Venta POS ${saleId} marcada como pagada (desde Webhook)`);
          if (io) io.emit('sale_update', sale); // Emitir un evento nuevo
        }
      }
      // ------------------------------------

      return res.status(200).send('OK');

    } catch (error) {
      console.error('❌ Error processing payment webhook:', error);
      return res.status(500).send('Error processing payment');
    }
  }

  return res.status(200).send('Ignored: Not a payment notification');
};


// ==========================================
// 5. WEBHOOK QR (Obsoleto)
// ==========================================
const receiveWebhookQR = async (req, res) => {
  console.log('⚠️  Webhook QR (obsoleto) recibido. Redirigiendo al webhook principal.');
  return receiveWebhook(req, res);
};

module.exports = {
  createBookingPreference,
  createBookingQRDynamic,
  createPosPreference, // <-- EXPORTAR LA NUEVA FUNCIÓN
  receiveWebhook,
  receiveWebhookQR
};
