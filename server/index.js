const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Confiar en el primer proxy (ej. Render, Heroku). Esencial para que CORS funcione correctamente.
app.set('trust proxy', 1);

// --- Configuración de CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app'
];

const corsOptions = {
    origin: (origin, callback) => {
        // Permite orígenes en la lista y peticiones sin origen (ej: Postman)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    credentials: true,
};

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
// Habilitar CORS para todas las rutas y peticiones pre-vuelo (OPTIONS)
// ESTA ES LA UBICACIÓN CORRECTA: Antes de definir las rutas.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

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
