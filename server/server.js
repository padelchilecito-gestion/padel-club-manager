// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const http = require('http'); // Necesario para socket.io
const cors = require('cors'); // Importar CORS
const connectDB = require('./config/db');
const { initSocket } = require('./config/socket');
const allRoutes = require('./routes/index');
// La línea que importaba 'loadSettings' de mercadopago-config fue eliminada

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

// La llamada a 'loadSettings()' fue eliminada

const app = express();

// --- Configurar CORS (Esto es lo que agregamos y está correcto) ---
// Definir los orígenes permitidos
const allowedOrigins = [
  'https://padel-club-manager-xi.vercel.app', // Tu frontend en Vercel
  'http://localhost:5173' // Para desarrollo local
];

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como Postman) o si el origen está en la lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions)); // <-- APLICAR MIDDLEWARE DE CORS

// Middlewares de Express
app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear form-data

// Rutas de la API
app.use('/api', allRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('API de Padel Club Manager funcionando.');
});

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.io
initSocket(server, allowedOrigins); // Pasar orígenes permitidos a socket

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
