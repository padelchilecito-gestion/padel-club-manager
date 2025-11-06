// server/server.js (CORREGIDO)
const express = require('express');
const dotenv = require('dotenv');
const http = require('http'); // Necesario para socket.io
const cors = require('cors'); // Importar CORS
const cookieParser = require('cookie-parser'); // <-- 1. IMPORTAR PAQUETE
const connectDB = require('./config/db');
const { setupSocketIO } = require('./config/socket');
const allRoutes = require('./routes/index');

// Cargar variables de entorno
dotenv.config();

// Conectar a la base de datos
connectDB();

const app = express();

// --- Configurar CORS ---
const allowedOrigins = [
  'https://padel-club-manager-xi.vercel.app', // Tu frontend en Vercel
  'https://padel-club-manager-xi.vercel.app/', // Con trailing slash
  'http://localhost:5173' // Para desarrollo local
];

const corsOptions = {
  origin: function (origin, callback) {
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
app.use(cookieParser()); // <-- 2. USAR MIDDLEWARE (¡ESTA ES LA CORRECCIÓN!)

// Rutas de la API
app.use('/api', allRoutes);

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.send('API de Padel Club Manager funcionando.');
});

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.io
const io = setupSocketIO(server, allowedOrigins);
app.set('socketio', io); 

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
