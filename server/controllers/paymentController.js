// server/controllers/paymentController.js (CORREGIDO)
const asyncHandler = require('express-async-handler');
const mercadopago = require('mercadopago');
const Booking = require('../models/Booking');
const { logActivity } = require('../utils/logActivity');

// (createMercadoPagoPreference, handleMercadoPagoWebhook, getPaymentStatus... no cambian)
// ... (Tu código existente para las otras 3 funciones) ...

const createMercadoPagoPreference = asyncHandler(async (req, res) => {
  // ... (Tu código existente)
});

const handleMercadoPagoWebhook = asyncHandler(async (req, res) => {
  // ... (Tu código existente)
});

const getPaymentStatus = asyncHandler(async (req, res) => {
  // ... (Tu código existente)
});


// --- INICIO DE LA CORRECCIÓN ---
// @desc    Crear una preferencia de pago para el POS
// @route   POST /api/payments/create-pos-preference
// @access  Private/AdminOrOperator
const createPosPreference = asyncHandler(async (req, res) => {
  const { items, totalAmount, saleId } = req.body;

  if (!items || !totalAmount || !saleId) {
    res.status(400);
    throw new Error('Faltan datos para la preferencia de pago (items, totalAmount, saleId)');
  }

  const preference = {
    items: items.map(item => ({
      title: item.name,
      unit_price: parseFloat(item.price.toFixed(2)),
      quantity: item.quantity,
      currency_id: 'ARS',
    })),
    back_urls: {
      // Como es POS, no hay back_urls. El frontend polleará el estado.
      success: `${process.env.CLIENT_URL}/admin/pos?sale_id=${saleId}&status=success`,
      failure: `${process.env.CLIENT_URL}/admin/pos?sale_id=${saleId}&status=failure`,
      pending: `${process.env.CLIENT_URL}/admin/pos?sale_id=${saleId}&status=pending`,
    },
    // auto_return: 'approved', // No usamos auto_return en POS
    notification_url: `${process.env.SERVER_URL}/api/payments/webhook`,
    external_reference: saleId, // Usamos el ID de la Venta para identificar el pago
  };

  try {
    const responseMp = await mercadopago.preferences.create(preference);
    
    // Devolvemos el init_point (URL del QR) al frontend
    res.json({ 
      init_point: responseMp.body.init_point,
      preferenceId: responseMp.body.id 
    });

  } catch (mpError) {
    console.error('Error al crear preferencia de Mercado Pago (POS):', mpError);
    res.status(500);
    throw new Error('Error al conectar con Mercado Pago. Intenta nuevamente.');
  }
});
// --- FIN DE LA CORRECCIÓN ---


module.exports = {
  createMercadoPagoPreference,
  handleMercadoPagoWebhook,
  getPaymentStatus,
  createPosPreference, // <-- Exportar la nueva función
};
