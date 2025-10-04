const mercadopago = require('mercadopago');
require('dotenv').config();

// Configure Mercado Pago SDK
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

module.exports = mercadopago;
