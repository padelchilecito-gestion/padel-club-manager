require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const generateRecurringBookings = require('./utils/generateRecurringBookings'); // <-- AÑADIDO

const startServer = async () => {
  // Connect to Database first
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  // --- Configuración de Orígenes Permitidos (para HTTP) ---
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app', // Tu frontend de Vercel
  ];
  
  // (Lógica por si CLIENT_URL está definida en Render y es diferente)
  if (process.env.CLIENT_URL && allowedOrigins.indexOf(process.env.CLIENT_URL) === -1) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  const corsOptions = {
    origin: function (origin, callback) {
      // Permitimos peticiones sin 'origin' (como Postman) y las de la lista
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(`CORS Error (HTTP): Origin ${origin} not allowed.`);
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };

  app.use(cors(corsOptions));
  app.use(express.json({ extended: false }));

  // --- Configuración de Socket.IO ---
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins, 
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
  // Habilitamos 'trust proxy' si estás detrás de un proxy (Render, Vercel)
  app.set('trust proxy', 1);

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, // Límite de 200 peticiones por IP cada 15 min
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10, // Límite de 10 intentos de login por IP cada 10 min
    message: 'Demasiados intentos de inicio de sesión, por favor intente de nuevo en 10 minutos',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Aplicar limitadores
  app.use('/api', apiLimiter); // Límite general para /api
  app.use('/api/auth/login', authLimiter); // Límite estricto para /api/auth/login

  app.get('/', (req, res) => res.send('Padel Club Manager API Running'));

  // Define Routes
  app.use('/api', apiRoutes);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);

    // --- INICIO: LÓGICA DEL CRON JOB ---
    // (Esta es una forma segura de correr un "cron" sin 'node-cron')
    // Comprueba cada 30 minutos.
    const runCron = async () => {
      try {
        const now = new Date();
        const minutes = now.getMinutes();
        
        // Ejecutar solo si estamos cerca de la hora (ej. 2:00 - 2:30 AM)
        if (now.getHours() === 2 && minutes < 30) {
          console.log('[CRON] Running daily task: generateRecurringBookings');
          await generateRecurringBookings();
        }
      } catch (err) {
        console.error('[CRON] Error during scheduled task:', err);
      } finally {
        // Vuelve a programar la comprobación para dentro de 30 minutos
        setTimeout(runCron, 30 * 60 * 1000); 
      }
    };
    
    // Inicia el primer ciclo del cron
    console.log('[CRON] Scheduled job started. Will check every 30 minutes.');
    runCron();
    // --- FIN: LÓGICA DEL CRON JOB ---
  });
};

startServer();
