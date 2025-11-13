require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');

const startServer = async () => {
  // Connect to Database first
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  // --- 1. HABILITAMOS CORS PARA TODOS (*) ---
  // (Esto es solo para depurar)
  app.use(cors({
    origin: '*', // Acepta cualquier origen
    credentials: true
  }));
  
  app.use(express.json({ extended: false }));

  // --- 2. HABILITAMOS CORS PARA SOCKET.IO (*) ---
  const io = new Server(server, {
    cors: {
      origin: '*', // Acepta cualquier origen
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
  });

  app.set('socketio', io);

  io.on('connection', (socket) => {
    console.log(`A user connected via WebSocket (Origin: ${socket.handshake.headers.origin})`);
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  // --- Seguridad: Rate Limiting ---
  app.set('trust proxy', 1);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 200, 
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, 
    max: 10, 
    message: 'Demasiados intentos de inicio de sesión, por favor intente de nuevo en 10 minutos',
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api', apiLimiter); 
  app.use('/api/auth/login', authLimiter); 

  app.get('/', (req, res) => res.send('Padel Club Manager API Running'));

  // Define Routes
  app.use('/api', apiRoutes);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
  });
};

startServer();
