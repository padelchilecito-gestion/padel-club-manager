// server/controllers/settingController.js - CÓDIGO DE DIAGNÓSTICO
const mongoose = require('mongoose');
const Setting = require('../models/Setting');

exports.getSettings = async (req, res) => {
  try {
    // --- INICIO DE REGISTROS DE DIAGNÓSTICO ---
    console.log("--- INICIANDO DIAGNÓSTICO EN VIVO (getSettings) ---");

    // 1. Verificar si la variable de entorno está llegando a la función
    if (process.env.MONGO_URI) {
      console.log(`Variable MONGO_URI: Recibida correctamente (longitud: ${process.env.MONGO_URI.length})`);
    } else {
      console.error("¡¡¡ERROR CRÍTICO: La variable MONGO_URI no está llegando a la función!!!");
    }

    // 2. Verificar el estado de la conexión a la base de datos en este instante
    const connectionState = mongoose.connection.readyState;
    console.log(`Estado de la conexión Mongoose: ${connectionState} (1 = Conectado, 2 = Conectando, 0 = Desconectado)`);

    if (connectionState !== 1) {
        console.error("Error de Conexión: La función se ejecutó pero no hay conexión activa a la BD.");
    }
    // --- FIN DE REGISTROS DE DIAGNÓSTICO ---

    const settings = await Setting.findOne();

    if (!settings) {
      console.log("Resultado de la consulta: Setting.findOne() no devolvió ningún documento.");
      return res.status(404).json({ message: 'La configuración del club no está completa. Por favor, contacta al administrador.' });
    }

    console.log("Resultado de la consulta: ¡Éxito! Se encontró el documento de configuración.");
    res.json(settings);

  } catch (error) {
    console.error("Error catastrófico durante la ejecución de getSettings:", error);
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};