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

  // --- 1. Lista de Orígenes EXACTOS Permitidos ---
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app', // Tu frontend de Vercel (Producción)
  ];
  
  // (Lógica por si CLIENT_URL está definida en Render y es diferente)
  if (process.env.CLIENT_URL && allowedOrigins.indexOf(process.env.CLIENT_URL) === -1) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  // --- 2. Función de Verificación de CORS (LA SOLUCIÓN DEFINITIVA) ---
  const originCheck = (origin, callback) => {
    if (!origin) {
      callback(null, true); // Permitir peticiones sin origen (Postman, etc.)
      return;
    }

    // Normalizamos el origen quitando la barra final si existe
    const normalizedOrigin = origin.replace(/\/$/, '');

    // Chequeo 1: ¿Está en la lista de orígenes exactos?
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
      return;
    }

    // Chequeo 2: (NUEVA LÓGICA) Chequeamos Vercel Previews
    // Acepta: https://padel-club-manager-[...ALEATORIO...]-eduardo-miguel-riccis-projects.vercel.app
    const isVercelPreview = 
          normalizedOrigin.startsWith('https://padel-club-manager-') &&
          normalizedOrigin.endsWith('-eduardo-miguel-riccis-projects.vercel.app');

    if (isVercelPreview) {
      callback(null, true);
      return;
    }
    
    // Si no cumple ninguna, rechazar
    console.error(`CORS Error: Origin ${origin} not allowed.`);
    callback(new Error('Not allowed by CORS'));
  };

  // --- 3. Aplicar CORS a HTTP (Axios) ---
  app.use(cors({
    origin: originCheck, // Usamos la nueva función
    credentials: true
  }));
  
  app.use(express.json({ extended: false }));

  // --- 4. Aplicar CORS a Socket.IO ---
  const io = new Server(server, {
    cors: {
      origin: originCheck, // Usamos la MISMA función
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
