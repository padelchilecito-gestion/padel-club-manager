require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const setupBookingReminders = require('./tasks/bookingReminders');
const { configureCloudinary } = require('./config/cloudinaryConfig');

const startServer = async () => {
//<<<<<<< fix/backend-syntax-errors//
  // Conectar a la base de datos primero
  await connectDB();

  // NOTA IMPORTANTE: Se establece la zona horaria de Argentina como principal.
  // Esto es crucial para que todas las operaciones con fechas funcionen correctamente.
  process.env.TZ = 'America/Argentina/Buenos_Aires';
  console.log(`Timezone forced to: ${process.env.TZ}`);
//=======//
  await connectDB();
  await configureCloudinary();
//>>>>>>> main//

  const app = express();
  const server = http.createServer(app);

//<<<<<<< fix/backend-syntax-errors//
  // Configuración de CORS
//=======//
//>>>>>>> main//
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app',
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
//<<<<<<< fix/backend-syntax-errors//
    credentials: true,
//=======//
    credentials: true
//>>>>>>> main//
  };

  app.use(cors(corsOptions));
  app.use(express.json({ extended: false }));

//<<<<<<< fix/backend-syntax-errors//
  // Configuración de Socket.IO
  const io = new Server(server, {
    cors: corsOptions,
//=======//
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
//>>>>>>> main//
  });

  app.set('socketio', io);

  io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  app.get('/', (req, res) => res.send('Padel Club Manager API Running'));
//<<<<<<< fix/backend-syntax-errors//

  // Definir Rutas
//=======//
//>>>>>>> main//
  app.use('/api', apiRoutes);

  setupBookingReminders();

  return server;
};

module.exports = startServer;