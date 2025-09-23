const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// --- CAMBIO CLAVE: Configuración de CORS para Socket.IO ---
// Se debe especificar el path para que coincida con el cliente en Vercel
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ALLOWED_ORIGIN || "http://localhost:5173",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
    },
    path: "/api/socket.io/" // Especificamos un path para el socket
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

// Middlewares
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.error('Error de conexión a MongoDB:', err));

// Rutas de la API (sin el prefijo /api)
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

// CAMBIO CLAVE: Solo escucha en un puerto si no estás en Vercel
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log(`Servidor local corriendo en el puerto ${PORT}`));
}

// Exportar la app para Vercel
module.exports = app;