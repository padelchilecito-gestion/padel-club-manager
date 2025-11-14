require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const generateRecurringBookings = require('./utils/generateRecurringBookings'); 

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
  
  if (process.env.CLIENT_URL && allowedOrigins.indexOf(process.env.CLIENT_URL) === -1) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }

  // --- INICIO DE LA CORRECCIÓN DEL CRASH (503) ---
  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || 
          allowedOrigins.indexOf(origin) !== -1 || 
          (origin && origin.endsWith('.vercel.app'))
      ) {
        callback(null, true);
      } else {
        console.error(`CORS Error (HTTP): Origin ${origin} not allowed.`);
        // --- ESTE ES EL CAMBIO ---
        // En lugar de lanzar un error, solo lo bloqueamos.
        callback(null, false);
        // callback(new Error('Not allowed by CORS')); // <-- ESTO CAUSA EL CRASH
      }
    },
    credentials: true
  };
  // --- FIN DE LA CORRECCIÓN ---

  app.use(cors(corsOptions));
  app.use(express.json({ extended: false }));

  // --- Configuración de Socket.IO (CORREGIDA TAMBIÉN) ---
  const io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Aplicamos la MISMA lógica de CORS a Socket.IO
        if (!origin || 
            allowedOrigins.indexOf(origin) !== -1 || 
            (origin && origin.endsWith('.vercel.app'))
        ) {
          callback(null, true);
        } else {
          console.error(`CORS Error (Socket): Origin ${origin} not allowed.`);
          // --- ESTE ES EL CAMBIO ---
          callback(null, false);
          // callback(new Error('Not allowed by CORS')); // <-- ESTO CAUSABA EL CRASH
        }
      }, 
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
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 200, 
    message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 15 minutos',
    standardHeaders: true,
    legacyHeaders: false,
  });

  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutos
    max: 10, 
    message: 'Demasiados intentos de inicio de sesión, por favor intente de nuevo en 10 minutos',
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Aplicar limitadores
  app.use('/api', apiLimiter); 
  app.use('/api/auth/login', authLimiter); 

  app.get('/', (req, res) => res.send('Padel Club Manager API Running'));

  // Define Routes
  app.use('/api', apiRoutes);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);

    // --- LÓGICA DEL CRON JOB ---
    const runCron = async () => {
      try {
        const now = new Date();
        const minutes = now.getMinutes();
        
        if (now.getHours() === 2 && minutes < 30) {
          console.log('[CRON] Running daily task: generateRecurringBookings');
          await generateRecurringBookings();
        }
      } catch (err) {
        console.error('[CRON] Error during scheduled task:', err);
      } finally {
        setTimeout(runCron, 30 * 60 * 1000); 
      }
    };
    
    console.log('[CRON] Scheduled job started. Will check every 30 minutes.');
    runCron();
  });
};

startServer();
