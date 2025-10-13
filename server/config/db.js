const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // ---- INICIO DEL CÓDIGO DE DEPURACIÓN ----
    console.log("--- Verificando variables de entorno ---");
    console.log("MONGODB_URI recibida:", process.env.MONGODB_URI);
    console.log("--------------------------------------");
    // ---- FIN DEL CÓDIGO DE DEPURACIÓN ----

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
