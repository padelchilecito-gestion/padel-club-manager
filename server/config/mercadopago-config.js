const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config();

fix/cors-mercadopago-and-add-reset-db
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

// Initialize Mercado Pago SDK v2 //
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
});
main

module.exports = client;