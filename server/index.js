const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// --- 1. Inicialización de Express y Servidor ---
const app = express();
const server = http.createServer(app);

// --- 2. Configuración de CORS ---
// Define la lista de orígenes permitidos.
const allowedOrigins = [
    'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app'
];

// Define las opciones de CORS.
const corsOptions = {
    origin: (origin, callback) => {
        // Permite peticiones sin origen (como Postman) o desde los orígenes permitidos.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Origen no permitido por la política de CORS'));
        }
    },
    credentials: true
};

// --- 3. Middlewares Esenciales ---
// Es importante que el middleware de CORS se aplique ANTES que cualquier ruta.
// Esto asegura que las peticiones de pre-vuelo (OPTIONS) se manejen correctamente.
app.use(cors(corsOptions));

// Middleware para parsear el cuerpo de las peticiones a JSON.
app.use(express.json());

// --- 4. Configuración de Socket.IO ---
const io = new Server(server, {
    cors: corsOptions
});

// Middleware para hacer 'io' accesible en las rutas.
app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- 5. Importación de Rutas ---
const authRoutes = require('./routes/auth');
const courtRoutes = require('./routes/courts');
const bookingRoutes = require('./routes/bookings');
const productRoutes = require('./routes/products');
const paymentRoutes = require('./routes/payments');
const salesRoutes = require('./routes/sales');
const dashboardRoutes = require('./routes/dashboard');
const reportsRoutes = require('./routes/reports');
const settingsRoutes = require('./routes/settings');
const usersRoutes = require('./routes/users');
const logsRoutes = require('./routes/logs');
const cashboxRoutes = require('./routes/cashbox');
const adminTaskRoutes = require('./routes/admin-tasks');

// --- 6. Definición de Rutas de la API ---
// Ruta de health check para Render.
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Asignación del resto de las rutas.
app.use('/api/auth', authRoutes);
app.use('/api/courts', courtRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/products', productRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/cashbox', cashboxRoutes);
app.use('/api/admin-tasks', adminTaskRoutes);

// --- 7. Conexión a la Base de Datos y Arranque del Servidor ---
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Lógica de Socket.IO.
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Servidor iniciado en el puerto ${PORT}`));
