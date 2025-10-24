const express = require('express');
// const { logger, logErrors, errorHandler } = require('./middlewares/errorMiddleware'); // Comentado
const routes = require('./routes');
const { setupSocketIO } = require('./config/socket'); // Esto ahora debería funcionar
const { logActivity } = require('./utils/logActivity');
// --- CORRECCIÓN 1: Comentamos la importación de RabbitMQ ---
// const { connectToRabbitMQ } = require('./config/rabbitmq'); 
const { setupScheduledTasks } = require('./utils/scheduler');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const { protect, admin } = require('./middlewares/authMiddleware');

// Cargar variables de entorno
dotenv.config();

// Forzar zona horaria
process.env.TZ = 'America/Argentina/Buenos_Aires';
console.log(`Timezone forced to: ${process.env.TZ}`);

// Conectar a MongoDB
connectDB();

const app = express();

// Configuración de CORS (ya corregida)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://padel-club-manager.vercel.app',
  'https://padel-club-manager-qhy1hsl2y-eduardo-miguel-riccis-projects.vercel.app',
  'https://padel-club-manager-55zprq1ag-eduardo-miguel-riccis-projects.vercel.app' // Añadida por si acaso
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin 'origin' (como Postman o apps móviles) o si está en la lista
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS error: Origin ${origin} not allowed.`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Middlewares de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "'unsafe-inline'", "https://cdn.socket.io", "https://sdk.mercadopago.com"],
      "frame-src": ["'self'", "https://sdk.mercadopago.com"],
      "connect-src": [
        "'self'",
        "https://api.mercadopago.com",
        "https://padel-club-backend.onrender.com", 
        "wss://padel-club-backend.onrender.com",
        ...allowedOrigins
      ],
    },
  },
}));

// Loggeo de peticiones en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parser, cookie parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Sanitización de datos
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// Rate limiting
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutos
  max: 200, 
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 10 minutos.',
});
app.use('/api', limiter);

// Rutas API
app.use('/api', routes);

// Configuración para servir estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running in development mode...');
  });
}

// Middlewares de error (comentados)
// app.use(logErrors);
// app.use(errorHandler);
// app.use(logger); 

const PORT = process.env.PORT || 10000;

const server = http.createServer(app);

// Configurar Socket.IO
const io = setupSocketIO(server, allowedOrigins);
app.set('socketio', io); 

// Iniciar servidor
server.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  try {
    // --- CORRECCIÓN 2: Comentamos la conexión a RabbitMQ ---
    // const channel = await connectToRabbitMQ();
    // app.set('rabbitMQChannel', channel);
    // console.log('RabbitMQ connected and channel set in app.');
    // --- FIN DE CORRECCIÓN 2 ---
    
    // Configurar tareas programadas
    setupScheduledTasks();

  } catch (error) {
    console.error('Error during server startup:', error);
  }
});

// Manejo de promesas no capturadas
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
