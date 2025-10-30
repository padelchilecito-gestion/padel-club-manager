// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const http = require('http'); // Necesario para socket.io
const cors = require('cors'); // Importar CORS
const connectDB = require('./config/db');
// --- CORRECCIÓN DE IMPORTACIÓN ---
const { setupSocketIO } = require('./config/socket'); // Cambiado de initSocket
const allRoutes = require('./routes/index');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

// --- Configurar CORS ---
const allowedOrigins = [
  'https://padel-club-manager-xi.vercel.app', // Tu frontend en Vercel
  'https://padel-club-manager-xi.vercel.app/', // CORRECCIÓN: Añadido con trailing slash
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

// --- CORRECCIÓN DE LLAMADA A FUNCIÓN ---
// Inicializar Socket.io
setupSocketIO(server, allowedOrigins); // Cambiado de initSocket

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
