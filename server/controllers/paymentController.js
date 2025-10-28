// --- IMPORTACIONES ---
const { Preference, Payment } = require('mercadopago'); // Para Webhooks de Preferencias
const client = require('../config/mercadopago-config'); // Configuración SDK v3
const Booking = require('../models/Booking');
// const Sale = require('../models/Sale'); // Comentado - No implementamos QR de POS ahora
// const Product = require('../models/Product'); // Comentado - No implementamos QR de POS ahora
const Setting = require('../models/Setting');
const axios = require('axios'); // <--- AÑADIDO
const { format } = require('date-fns');
const mongoose = require('mongoose'); // Necesario para webhook POS (si se reactiva)

// ==========================================
// GENERAR QR DINÁMICO PARA RESERVA (TURNOS)
// ==========================================
const createBookingQRDynamic = async (req, res) => {
  const { bookingId } = req.body;
  const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

  try {
    // 1. Validar reserva
    const booking = await Booking.findById(bookingId).populate('court').populate('user'); // Populate user también
    if (!booking) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }
    if (booking.isPaid) {
      return res.status(400).json({ message: 'Esta reserva ya fue pagada.' });
    }

    // 2. Obtener USER_ID de Mercado Pago desde variables de entorno
    const userId = process.env.MERCADOPAGO_USER_ID;
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN; // Necesitamos el token también

    if (!userId || !mpAccessToken) {
      console.error('❌ Error: MERCADOPAGO_USER_ID y MERCADOPAGO_ACCESS_TOKEN deben estar configurados.');
      throw new Error('Credenciales de Mercado Pago incompletas en el servidor.');
    }

    // 3. Obtener settings (nombre del club)
    const settings = await Setting.findOne({ key: 'clubName' });
    const clubName = settings ? settings.value : 'Padel Club';

    // 4. Definir external_pos_id (punto de venta FIJO para turnos)
    // Puedes usar cualquier string, pero debe ser consistente
    const externalPosId = 'TURNOS01'; 
    console.log(`ℹ️ Usando external_pos_id fijo: ${externalPosId}`);


    // 5. Crear orden QR dinámica
    const qrOrderData = {
      external_reference: bookingId, // ID único de la reserva
      title: `Reserva ${format(new Date(booking.startTime), 'dd/MM HH:mm')}`,
      description: `Cancha: ${booking.court?.name || 'N/A'} | ${booking.user?.name || 'Cliente'}`,
      notification_url: `${baseUrl}/api/payments/webhook-qr`, // URL del NUEVO webhook
      total_amount: booking.price,
      items: [
        {
          sku_number: `BOOKING_${bookingId}`,
          category: 'sports_service', // Categoría más específica
          title: `Turno ${booking.court?.name || 'Cancha'}`,
          description: `Reserva para ${booking.user?.name || 'Cliente'}`,
          unit_price: booking.price,
          quantity: 1,
          unit_measure: 'unit',
          total_amount: booking.price
        }
      ],
      // No necesitamos 'cash_out' para este flujo
    };

    // 6. Llamar a la API de Mercado Pago para crear QR
    const url = `https://api.mercadopago.com/instore/orders/qr/seller/collectors/${userId}/pos/${externalPosId}/qrs`;
    console.log(`📞 Llamando a MP API (QR Dinámico): POST ${url}`);
    
    const qrResponse = await axios.post(
      url,
      qrOrderData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpAccessToken}` // Usar el Access Token
        }
      }
    );

    // Verificar si la respuesta contiene qr_data
    if (!qrResponse.data || !qrResponse.data.qr_data) {
        console.error('❌ Respuesta de MP no contiene qr_data:', qrResponse.data);
        throw new Error('Mercado Pago no devolvió los datos del QR.');
    }

    const qrData = qrResponse.data.qr_data; // Este es el string EMVCo
    // const inStoreOrderId = qrResponse.data.in_store_order_id; // ID interno de MP (útil para debug)

    console.log(`✅ QR Dinámico generado para booking: ${bookingId}`);
    // console.log('📱 QR Data:', qrData); // Opcional: loguear el string largo del QR
    // console.log('🆔 In-Store Order ID:', inStoreOrderId);

    // 7. Retornar data del QR al frontend
    res.json({
      qr_data: qrData, // String EMVCo para generar QR visualmente
      // order_id: inStoreOrderId, // Podríamos devolverlo si el frontend lo necesita
      amount: booking.price // Devolvemos el monto para mostrarlo
    });

  } catch (error) {
    // Loguear el error detallado de Axios si existe
    console.error('❌ Error creating QR dynamic:', error.response?.data || error.message);
    res.status(500).json({ 
      message: 'Error al generar QR dinámico',
      error: error.response?.data?.message || error.message 
    });
  }
};


// ==========================================
// WEBHOOK PARA QR DINÁMICO (merchant_order)
// ==========================================
const receiveWebhookQR = async (req, res) => {
  // MP envía 'topic' y 'resource' (URL de la orden) en el body para este webhook,
  // o a veces 'topic' y 'id' en query params. Seamos flexibles.
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

  // Solo procesar notificaciones de merchant_order
  if (topic !== 'merchant_order' || !orderId) {
    console.log(`ℹ️ Webhook QR Ignorado (topic: ${topic}, orderId: ${orderId})`);
    return res.status(200).send('Notification ignored (invalid topic or missing ID)');
  }

  try {
    // 1. Obtener la Merchant Order usando el ID y el Access Token
    const mpAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!mpAccessToken) throw new Error("Access Token no configurado");

    const orderResponse = await axios.get(
      `https://api.mercadopago.com/merchant_orders/${orderId}`,
      {
        headers: {
          'Authorization': `Bearer ${mpAccessToken}`
        }
      }
    );
    const order = orderResponse.data;
    
    console.log('📦 Detalles Merchant Order:', {
      id: order.id,
      status: order.status,
      external_reference: order.external_reference,
      total_amount: order.total_amount,
      paid_amount: order.paid_amount,
      payments: order.payments?.map(p => ({ id: p.id, status: p.status })) || []
    });

    // 2. Solo procesar órdenes cerradas (pagadas completamente)
    // Verificamos 'status: closed' y que el monto pagado cubra el total
    if (order.status !== 'closed' || order.paid_amount < order.total_amount) {
      console.log(`⏳ Orden ${orderId} no cerrada/pagada completamente (status: ${order.status}, paid: ${order.paid_amount}/${order.total_amount})`);
      return res.status(200).send('Order not fully paid or closed yet');
    }

    // 3. Verificar que tenga external_reference (debería ser nuestro bookingId)
    const externalRef = order.external_reference;
    if (!externalRef) {
      console.log(`⚠️ Orden ${orderId} sin external_reference`);
      return res.status(200).send('No external_reference found');
    }

    // --- ASUMIMOS QUE ES UNA RESERVA (bookingId) ---
    // (Si necesitaras diferenciar entre QR de Turno y QR de POS, 
    // podrías añadir un prefijo a external_reference al crear el QR)
    
    console.log(`🔄 Procesando pago QR para external_reference: ${externalRef}`);
    const booking = await Booking.findById(externalRef);
        
    if (!booking) {
      console.error(`❌ Booking no encontrado para external_reference: ${externalRef} (Order ID: ${orderId})`);
      // Respondemos OK a MP para que no reintente, pero logueamos el error.
      return res.status(200).send('Booking not found for external reference'); 
    }

    if (booking.isPaid) {
      console.log(`ℹ️ Booking ${externalRef} ya estaba pagado (Order ID: ${orderId}). Ignorando.`);
      return res.status(200).send('Booking already paid');
    }

    // Determinar método de pago a partir de los pagos asociados a la orden
    let paymentMethod = 'QR Mercado Pago'; // Default más específico
    if (order.payments && order.payments.length > 0) {
      // Tomamos info del primer pago aprobado asociado a la orden
      const firstApprovedPayment = order.payments.find(p => p.status === 'approved');
      if (firstApprovedPayment) {
          // Podríamos hacer otra llamada a /v1/payments/{payment_id} para más detalles si fuera necesario
          // Pero con el tipo suele ser suficiente
          const paymentType = firstApprovedPayment.payment_type_id || 'unknown'; // 'account_money', 'credit_card', etc.
          if (paymentType === 'account_money') { paymentMethod = 'QR MP Saldo'; }
          else if (paymentType === 'credit_card') { paymentMethod = 'QR MP Crédito'; }
          else if (paymentType === 'debit_card') { paymentMethod = 'QR MP Débito'; }
          else { paymentMethod = `QR MP (${paymentType})`; }
      }
    }

    // Marcar reserva como pagada
    booking.isPaid = true;
    booking.status = 'Confirmed';
    booking.paymentMethod = paymentMethod;
    await booking.save();

    console.log(`✅ Booking ${booking._id} (Order ID: ${orderId}) pagado vía ${paymentMethod}`);

    // Emitir Socket.IO para actualizar el frontend
    const io = req.app.get('socketio');
    if (io) {
      io.emit('booking_update', booking);
      console.log(`📡 Socket.IO: booking_update emitido para ${booking._id}`);
    }

    res.status(200).send('Booking payment processed successfully via QR webhook');

  } catch (error) {
    console.error('❌ Error processing webhook QR:', error.response?.data || error.message);
    // Respondemos OK a MP para evitar reintentos infinitos si el error es nuestro
    res.status(200).send('Error processing webhook internally'); 
  }
};

// ==========================================
// WEBHOOK ORIGINAL (Para Preferencias Web - si aún se usan)
// ==========================================
const receiveWebhook = async (req, res) => {
  const { type, data } = req.body;
  console.log('🔔 Webhook Preference Recibido:', { type, data });
  // ... (El código de receiveWebhook que tenías antes, para manejar pagos de init_point si es necesario) ...
  if (type === 'payment' && data?.id) {
     try {
       const paymentClient = new Payment(client);
       const payment = await paymentClient.get({ id: data.id });
       if (payment && payment.status === 'approved' && payment.metadata?.booking_id) {
           const booking = await Booking.findById(payment.metadata.booking_id);
           if (booking && !booking.isPaid) {
              // ... (lógica para determinar paymentMethod y actualizar booking) ...
              let paymentMethod = 'MP Web'; // Simplificado
               if (payment.payment_method_id === 'account_money') { paymentMethod = 'MP Saldo Web'; }
               // ... (otras detecciones si quieres) ...
              booking.isPaid = true;
              booking.status = 'Confirmed';
              booking.paymentMethod = paymentMethod;
              await booking.save();
              console.log(`✅ Booking ${booking._id} pagado via Preference Web - ${paymentMethod}`);
              const io = req.app.get('socketio');
              if (io) io.emit('booking_update', booking);
           }
       }
        res.status(200).send('Webhook Preference processed');
     } catch (error) {
       console.error('Error processing webhook Preference:', error);
       res.status(200).send('Error processing webhook Preference'); // OK para MP
     }
  } else {
     res.status(200).send('Webhook Preference ignored (not payment or no data id)');
  }
};


module.exports = {
  // --- Exportar las funciones correctas ---
  createBookingQRDynamic, // La nueva para QR real de Turnos
  // createSaleQRDynamic, // Comentada - No la implementamos ahora
  receiveWebhookQR,       // El nuevo webhook para QR real
  receiveWebhook,         // El webhook original para pagos web (si aplica)
  // createBookingPreferenceQR, // Ya no usamos esta si QR dinámico funciona
  // createPaymentPreference, // Si tienes un checkout web general
};
