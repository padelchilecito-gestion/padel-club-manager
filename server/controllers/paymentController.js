// server/controllers/paymentController.js (CORREGIDO Y COMPLETADO)
const asyncHandler = require('express-async-handler');
const { mercadopago } = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product'); // Necesario para el webhook de venta
const { logActivity } = require('../utils/logActivity');

// @desc    Crear preferencia de pago para QR
// @route   POST /api/payments/create-qr
// @access  Private/AdminOrOperator
const createQrPayment = asyncHandler(async (req, res) => {
  // --- INICIO DE LA CORRECCIÓN 1 ---
  const { saleId, bookingId, items, totalAmount } = req.body;
  const io = req.app.get('socketio');

  // 1. Validar que los datos mínimos existan
  if ((!saleId && !bookingId) || !items || !totalAmount) {
    console.error('Error: Faltan datos para generar QR', { saleId, bookingId, items, totalAmount });
    res.status(400);
    throw new Error('Faltan datos (ID de Venta/Reserva, Items o Monto) para generar el QR.');
  }

  // 2. Determinar el tipo de pago y el ID
  let paymentType = '';
  let paymentId = '';

  if (saleId) {
    paymentType = 'sale';
    paymentId = saleId;
  } else if (bookingId) {
    paymentType = 'booking';
    paymentId = bookingId;
  }

  // 3. Configurar la URL de notificación (Webhook) para incluir el tipo y el ID
  const notification_url = `${process.env.BACKEND_URL}/api/payments/webhook?type=${paymentType}&id=${paymentId}`;

  // --- FIN DE LA CORRECCIÓN 1 ---

  const preference = {
    items: items.map(item => ({
      id: item.id,
      title: item.title,
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price),
      currency_id: 'ARS',
    })),
    back_urls: {
      success: `${process.env.FRONTEND_URL}/admin/pos`, // Redirige a POS (o donde prefieras)
      failure: `${process.env.FRONTEND_URL}/admin/pos`,
      pending: `${process.env.FRONTEND_URL}/admin/pos`,
    },
    auto_return: 'approved',
    notification_url: notification_url, // URL de webhook actualizada
    external_reference: paymentId, // Usamos el ID (saleId o bookingId)
    total_amount: Number(totalAmount), // Monto total
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    
    // Devolvemos la preferencia completa, el frontend usará 'init_point' o 'qr_code'
    res.json({ 
      id: response.body.id,
      init_point: response.body.init_point, // URL para QR
      qr_code_base64: response.body.point_of_interaction?.transaction_data?.qr_code_base64,
      qr_code: response.body.point_of_interaction?.transaction_data?.qr_code
    });

  } catch (error) {
    console.error('Error al crear preferencia de MercadoPago:', error);
    res.status(500);
    throw new Error('Error al conectar con MercadoPago.');
  }
});

// @desc    Manejar notificaciones de webhook de MercadoPago
// @route   POST /api/payments/webhook
// @access  Public
const handleWebhook = asyncHandler(async (req, res) => {
  const payment = req.body;

  // --- INICIO DE LA CORRECCIÓN 2 ---
  // Obtener nuestro tipo e ID desde los query params
  const { type, id } = req.query;

  if (!type || !id) {
    console.warn('Webhook recibido sin query params "type" o "id".');
    return res.status(400).send('Faltan query params');
  }
  // --- FIN DE LA CORRECCIÓN 2 ---

  if (payment.type === 'payment') {
    const data = await mercadopago.payment.findById(payment.data.id);
    const paymentDetails = data.body;

    // Verificar que el pago esté aprobado y el external_reference coincida
    if (paymentDetails.status === 'approved' && paymentDetails.external_reference === id) {
      const io = req.app.get('socketio');

      try {
        // --- INICIO DE LA CORRECCIÓN 3 ---
        // Actualizar el modelo correcto (Booking o Sale)
        if (type === 'booking') {
          const booking = await Booking.findById(id);
          if (booking && !booking.isPaid) {
            booking.isPaid = true;
            booking.status = 'Confirmed';
            booking.paymentMethod = 'MercadoPago';
            await booking.save();

            console.log(`Reserva ${id} pagada por Webhook.`);
            io.emit('bookingUpdated', booking); // Notificar al frontend
            await logActivity('Booking', id, 'payment_success_webhook', null, { method: 'MercadoPago' });
          }
        }
        else if (type === 'sale') {
          const sale = await Sale.findById(id);
          if (sale && !sale.isPaid) {
            sale.isPaid = true;
            await sale.save();

            // Lógica de reducción de stock (que estaba en createSale)
            // se mueve aquí para ventas con MP
            for (const item of sale.items) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
              });
            }

            console.log(`Venta ${id} pagada por Webhook.`);
            io.emit('saleUpdated', sale); // Notificar al frontend
            await logActivity('Sale', id, 'payment_success_webhook', null, { method: 'MercadoPago' });
          }
        }
        // --- FIN DE LA CORRECCIÓN 3 ---

      } catch (error) {
        console.error(`Error al procesar ${type} ${id} desde Webhook:`, error);
        // Devolvemos 200 a MP aunque fallemos internamente, para evitar reintentos.
      }
    }
  }

  res.status(200).send('OK'); // Responder a MercadoPago que recibimos el webhook
});

module.exports = {
  createQrPayment,
  handleWebhook,
};