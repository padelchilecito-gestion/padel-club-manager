const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config();

// Crea un cliente con tus credenciales
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

module.exports = client;