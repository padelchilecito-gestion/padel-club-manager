// server/controllers/paymentController.js (CORREGIDO Y UNIFICADO)
const asyncHandler = require('express-async-handler');
const { mercadopago } = require('../config/mercadopago-config');
const Booking = require('../models/Booking');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { logActivity } = require('../utils/logActivity');

/**
 * @desc    Crear preferencia de pago para QR (Unificado para Ventas y Reservas)
 * @route   POST /api/payments/create-qr
 * @access  Private/AdminOrOperator
 */
const createQrPayment = asyncHandler(async (req, res) => {
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

  // 3. Configurar la URL de notificación (Webhook)
  // Usamos el 'external_reference' en lugar de query params para más fiabilidad.
  const notification_url = `${process.env.BACKEND_URL || process.env.SERVER_URL}/api/payments/webhook`;

  const preference = {
    items: items.map(item => ({
      id: item.id || item._id, // Usar item.id o item._id
      title: item.title || item.name, // Usar item.title o item.name
      quantity: Number(item.quantity),
      unit_price: Number(item.unit_price || item.price), // Usar item.unit_price o item.price
      currency_id: 'ARS',
    })),
    back_urls: {
      success: `${process.env.CLIENT_URL}/admin/pos?status=success`,
      failure: `${process.env.CLIENT_URL}/admin/pos?status=failure`,
      pending: `${process.env.CLIENT_URL}/admin/pos?status=pending`,
    },
    auto_return: 'approved',
    notification_url: notification_url,
    external_reference: `${paymentType}:${paymentId}`, // Referencia CLAVE: "sale:ID" o "booking:ID"
  };

  try {
    const response = await mercadopago.preferences.create(preference);
    
    // Devolvemos la preferencia completa
    res.json({ 
      id: response.body.id,
      init_point: response.body.init_point,
      qr_code_base64: response.body.point_of_interaction?.transaction_data?.qr_code_base64,
      qr_code: response.body.point_of_interaction?.transaction_data?.qr_code
    });

  } catch (error) {
    console.error('Error al crear preferencia de MercadoPago:', error);
    res.status(500);
    throw new Error('Error al conectar con MercadoPago.');
  }
});

/**
 * @desc    Manejar notificaciones de webhook de MercadoPago (Unificado)
 * @route   POST /api/payments/webhook
 * @access  Public
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const payment = req.body;

  if (payment.type === 'payment') {
    const data = await mercadopago.payment.findById(payment.data.id);
    const paymentDetails = data.body;

    // Extraer nuestro tipo e ID desde la external_reference
    const externalReference = paymentDetails.external_reference;
    if (!externalReference || !externalReference.includes(':')) {
       console.warn('Webhook recibido sin external_reference válida.');
       return res.status(400).send('Referencia externa inválida');
    }

    const [type, id] = externalReference.split(':');

    // Verificar que el pago esté aprobado
    if (paymentDetails.status === 'approved') {
      const io = req.app.get('socketio');

      try {
        if (type === 'booking') {
          const booking = await Booking.findById(id);
          if (booking && !booking.isPaid) {
            booking.isPaid = true;
            booking.status = 'Confirmed';
            booking.paymentMethod = 'MercadoPago';
            await booking.save();

            console.log(`Reserva ${id} pagada por Webhook.`);
            io.emit('bookingUpdated', booking);
            await logActivity('Booking', id, 'payment_success_webhook', null, { method: 'MercadoPago' });
          }
        }
        else if (type === 'sale') {
          const sale = await Sale.findById(id);
          if (sale && !sale.isPaid) {
            sale.isPaid = true;
            await sale.save();

            // Reducir stock solo cuando el pago de MP está aprobado
            for (const item of sale.items) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity }
              });
            }

            console.log(`Venta ${id} pagada por Webhook.`);
            io.emit('saleUpdated', sale);
            await logActivity('Sale', id, 'payment_success_webhook', null, { method: 'MercadoPago' });
          }
        }
      } catch (error) {
        console.error(`Error al procesar ${type} ${id} desde Webhook:`, error);
      }
    }
  }

  res.status(200).send('OK'); // Responder a MercadoPago
});

/**
 * @desc    Obtener estado de un pago de MercadoPago
 * @route   GET /api/payments/status/:paymentId
 * @access  Private
 */
const getPaymentStatus = asyncHandler(async (req, res) => {
   try {
    const response = await mercadopago.payment.findById(req.params.paymentId);
    res.json({
      id: response.body.id,
      status: response.body.status,
      status_detail: response.body.status_detail,
      external_reference: response.body.external_reference
    });
  } catch (error) {
    console.error('Error al obtener estado de pago:', error);
    res.status(500);
    throw new Error('Error al consultar estado en MercadoPago.');
  }
});


module.exports = {
  createQrPayment,
  handleWebhook,
  getPaymentStatus,
};