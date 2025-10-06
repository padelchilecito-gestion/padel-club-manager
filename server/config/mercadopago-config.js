const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config();


// Initialize Mercado Pago SDK v2
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

// Inicializa el cliente con tu Access Token
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });


module.exports = client;