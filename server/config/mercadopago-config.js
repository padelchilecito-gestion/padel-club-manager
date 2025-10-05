const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config();

// Inicializa el cliente con tu Access Token
const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

module.exports = client;