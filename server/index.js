const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- Configuración de CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app'
];

const corsOptions = {
    origin: allowedOrigins, // Usar directamente el array de orígenes
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // OPTIONS se maneja implícitamente
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    credentials: true
};

// Habilitar CORS para todas las rutas HTTP antes de cualquier otra ruta
app.use(cors(corsOptions));

const io = new Server(server, {
    cors: corsOptions
});

// --- Importar Rutas ---
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

// Middlewares
app.use(express.json());

// Middleware para loguear todas las peticiones entrantes
app.use((req, res, next) => {
    console.log(`[INCOMING REQUEST] Method: ${req.method}, URL: ${req.originalUrl}`);
    next();
});

app.use((req, res, next) => {
    req.io = io;
    next();
});

// =================================================================
// ===== INICIO DE LA SOLUCIÓN: RUTA PARA EL HEALTH CHECK DE RENDER =====
// =================================================================
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'ok' });
});
// =================================================================
// ===== FIN DE LA SOLUCIÓN =======================================
// =================================================================

// --- Verificación de Variables de Entorno Críticas ---
if (!process.env.MONGODB_URI) {
    console.error("FATAL ERROR: MONGODB_URI is not defined in .env file.");
    process.exit(1); // Detiene la aplicación si la variable no está definida
}

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Conectado a MongoDB'))
    .catch(err => {
        console.error('Error de conexión a MongoDB:', err);
        process.exit(1); // También detiene la aplicación si la conexión falla
    });

// Rutas de la API
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

// Lógica de Socket.IO
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
