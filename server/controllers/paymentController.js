// --- IMPORTACIONES ---
const { Preference, Payment } = require('mercadopago'); // Para Webhooks de Preferencias (si aún se usan)
const client = require('../config/mercadopago-config'); // Configuración SDK v3 (usado por Payment)
const Booking = require('../models/Booking');
// const Sale = require('../models/Sale'); // Comentado - No implementamos QR de POS ahora
// const Product = require('../models/Product'); // Comentado - No implementamos QR de POS ahora
const Setting = require('../models/Setting');
const axios = require('axios'); // <--- NECESARIO
const { format } = require('date-fns');
const mongoose = require('mongoose');

// ==========================================
// GENERAR QR DINÁMICO PARA RESERVA (TURNOS) - MÉTODO CORRECTO
// ==========================================
const createBookingQRDynamic = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  try {
    // 1. Validar reserva
    const booking = await Booking.findById(bookingId).populate('court').populate('user');
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'Esta reserva ya fue pagada.' });
    }

    // 2. Obtener USER_ID y Access Token de Mercado Pago
    const userId = process.env.MERCADOPAGO_USER_ID;
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!userId || !mpAccessToken) {
      console.error('❌ Error: MERCADOPAGO_USER_ID y MERCADOPAGO_ACCESS_TOKEN deben estar configurados en variables de entorno.');
      throw new Error('Credenciales de Mercado Pago incompletas en el servidor.');
    }

    // 3. Obtener settings (nombre del club)
    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    // 4. Definir external_pos_id (ID fijo para identificar este punto de venta virtual)
    const externalPosId = 'TURNOS01'; // Puedes mantener este o cambiarlo por algo como 'PADELCLUB_ADMIN'
    console.log(`ℹ️ Usando external_pos_id fijo para QR: ${externalPosId}`);

    // 5. Crear cuerpo de la orden QR dinámica
    const qrOrderData = {
      external_reference: bookingId, // ID único de la reserva para identificarla en el webhook
      title: `Reserva ${format(new Date(booking.startTime), 'dd/MM HH:mm')}`,
      description: `Cancha: ${booking.court?.name || 'N/A'} | ${booking.user?.name || 'Cliente'} - ${clubName}`,
      // USA EL NUEVO WEBHOOK para merchant_order
      notification_url: `${baseUrl}/api/payments/webhook-qr`, 
      total_amount: booking.price,
      items: [
        {
          sku_number: `BOOKING_${bookingId}`,
          category: 'sports_service',
          title: `Turno ${booking.court?.name || 'Cancha'}`,
          description: `Reserva para ${booking.user?.name || 'Cliente'}`,
          unit_price: booking.price,
          quantity: 1,
          unit_measure: 'unit',
          total_amount: booking.price
        }
      ],
    };

    // 6. Llamar a la API de Mercado Pago correcta para crear QR sin Store ID
    const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/qrs`;
    console.log(`📞 Llamando a MP API (QR Dinámico Simplificado): POST ${url}`);
    
    const qrResponse = await axios.post(
      url,
      qrOrderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpAccessToken}`
        }
      }
    );

    // Verificar si la respuesta contiene qr_data
    if (!qrResponse.data || !qrResponse.data.qr_data) {
        console.error('❌ Respuesta de MP no contiene qr_data:', qrResponse.data);
        throw new Error('Mercado Pago no devolvió los datos del QR.');
    }

    const qrData = qrResponse.data.qr_data; // String EMVCo
    // const inStoreOrderId = qrResponse.data.in_store_order_id; // Útil para debug

    console.log(`✅ QR Dinámico generado para booking: ${bookingId}`);
    // console.log('📱 QR Data:', qrData); // Opcional: loguear el string largo

    // 7. Retornar data del QR al frontend
    res.json({
      qr_data: qrData,
      amount: booking.price
    });

  } catch (error) {
    console.error('❌ Error creating QR dynamic:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Error al generar QR dinámico',
      error: error.response?.data?.message || error.message 
    });
  }
};

// ==========================================
// WEBHOOK PARA QR DINÁMICO (merchant_order) - CORRECTO PARA ESTA API
// ==========================================
const receiveWebhookQR = async (req, res) => {
  const notificationData = req.body;
  const topic = notificationData?.topic || req.query?.topic;
  let orderId = null;

  // Extraer ID de la URL 'resource' o del query param 'id'
  if (notificationData?.resource) {
      try {
          const urlParts = notificationData.resource.split('/');
          orderId = urlParts[urlParts.length - 1];
      } catch (e) { console.error("Error parsing resource URL:", notificationData.resource); }
  } else if (req.query?.id) {
      orderId = req.query.id;
  }
  
  console.log('🔔 Webhook QR Recibido:', { topic, orderId, body: req.body, query: req.query });

  if (topic !== 'merchant_order' || !orderId) {
    console.log(`ℹ️ Webhook QR Ignorado (topic: ${topic}, orderId: ${orderId})`);
    return res.status(200).send('Notification ignored (invalid topic or missing ID)');
  }

  try {
    // 1. Obtener la Merchant Order
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) throw new Error("Access Token no configurado");

    const orderResponse = await axios.get(
      `https://api.mercadopago.com/merchant_orders/${orderId}`,
      { headers: { 'Authorization': `Bearer ${mpAccessToken}` } }
    );
    const order = orderResponse.data;
    
    console.log('📦 Detalles Merchant Order:', { /* ... datos relevantes ... */ });

    // 2. Solo procesar órdenes cerradas y pagadas
    if (order.status !== 'closed' || order.paid_amount < order.total_amount) {
      console.log(`⏳ Orden ${orderId} no cerrada/pagada completamente.`);
      return res.status(200).send('Order not fully paid or closed yet');
    }

    // 3. Usar external_reference para encontrar el Booking
    const externalRef = order.external_reference;
    if (!externalRef) {
      console.log(`⚠️ Orden ${orderId} sin external_reference`);
      return res.status(200).send('No external_reference found');
    }

    console.log(`🔄 Procesando pago QR para booking con external_reference: ${externalRef}`);
    const booking = await Booking.findById(externalRef);
        
    if (!booking) {
      console.error(`❌ Booking no encontrado para external_reference: ${externalRef} (Order ID: ${orderId})`);
      return res.status(200).send('Booking not found'); 
    }

    if (booking.isPaid) {
      console.log(`ℹ️ Booking ${externalRef} ya estaba pagado. Ignorando webhook.`);
      return res.status(200).send('Booking already paid');
    }

    // Determinar método de pago (mejorado)
    let paymentMethod = 'QR Mercado Pago';
    const firstApprovedPayment = order.payments?.find(p => p.status === 'approved');
    if (firstApprovedPayment) {
        const paymentType = firstApprovedPayment.payment_type_id || 'unknown';
        if (paymentType === 'account_money') { paymentMethod = 'QR MP Saldo'; }
        else if (paymentType === 'credit_card') { paymentMethod = 'QR MP Crédito'; }
        else if (paymentType === 'debit_card') { paymentMethod = 'QR MP Débito'; }
        else { paymentMethod = `QR MP (${paymentType})`; }
    }

    // Marcar reserva como pagada
    booking.isPaid = true;
    booking.status = 'Confirmed';
    booking.paymentMethod = paymentMethod;
    await booking.save();

    console.log(`✅ Booking ${booking._id} (Order ID: ${orderId}) pagado vía ${paymentMethod}`);

    // Emitir Socket.IO
    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_update', booking);
      console.log(`📡 Socket.IO: booking_update emitido para ${booking._id}`);
    }

    res.status(200).send('Booking payment processed via QR webhook');

  } catch (error) {
    console.error('❌ Error processing webhook QR:', error.response?.data || error.message);
    res.status(200).send('Error processing webhook internally'); 
  }
};

// ==========================================
// WEBHOOK ORIGINAL (Para Preferencias Web - si aún se usan)
// ==========================================
const receiveWebhook = async (req, res) => {
  // ... (Tu código para el webhook /webhook, si lo sigues necesitando para otros pagos) ...
  // Es importante que este webhook NO intente procesar los pagos que ya manejó receiveWebhookQR
  // Puedes diferenciar usando metadata distinta o simplemente ignorar si no usas pagos web.
  console.log('🔔 Webhook Preference Recibido (General):', req.body);
  // ... (Lógica simplificada o completa si es necesario) ...
  res.status(200).send('Webhook Preference endpoint reached');
};


module.exports = {
  createBookingQRDynamic, // La función correcta para QR de Turnos
  receiveWebhookQR,       // El webhook para QR de Turnos
  receiveWebhook,         // El webhook para otros pagos (si aplica)
  // ... (otras funciones exportadas como createPaymentPreference si las usas)
};
