const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();
const cron = require('node-cron');
const app = express();
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


const server = http.createServer(app);

// --- Configuración de CORS ---
const allowedOrigins = [
    'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app'
];

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
};

const io = new Server(server, {
    cors: corsOptions
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use((req, res, next) => {
    req.io = io;
    next();
});
// ⭐ Nueva ruta para Health Check
app.get('/api/status', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Backend is running' });
});
// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Rutas de la API
app.use('/dashboard', dashboardRoutes);
app.use('/reports', reportsRoutes);
app.use('/auth', authRoutes);
app.use('/courts', courtRoutes);
app.use('/bookings', bookingRoutes);
app.use('/products', productRoutes);
app.use('/payments', paymentRoutes);
app.use('/settings', settingsRoutes);
app.use('/sales', salesRoutes);
app.use('/users', usersRoutes);
app.use('/logs', logsRoutes);
app.use('/cashbox', cashboxRoutes);

// Lógica de Socket.IO
io.on('connection', (socket) => {
  console.log('Un cliente se ha conectado:', socket.id);
  socket.on('disconnect', () => {
    console.log('Cliente desconectado:', socket.id);
  });
});

// TAREA PROGRAMADA (Comentada)
// cron.schedule('*/15 * * * *', () => {
//     // checkAndSendReminders();
// });