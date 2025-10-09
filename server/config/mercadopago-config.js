const { MercadoPagoConfig } = require('mercadopago');
require('dotenv').config();

const client = new MercadoPagoConfig({ accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN });

module.exports = client;