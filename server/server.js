const express = require('express');
// --- CORRECCIÓN 1: Comentamos la línea que causa el crash 'MODULE_NOT_FOUND' ---
// const { logger, logErrors, errorHandler } = require('./middlewares/errorMiddleware');
const routes = require('./routes');
const { setupSocketIO } = require('./config/socket');
const { logActivity } = require('./utils/logActivity');
const { connectToRabbitMQ } = require('./config/rabbitmq');
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

// Forzar zona horaria (¡Importante!)
process.env.TZ = 'America/Argentina/Buenos_Aires';
console.log(`Timezone forced to: ${process.env.TZ}`);

// Conectar a MongoDB
connectDB();

const app = express();

// --- CORRECCIÓN 2: Añadimos la URL de Vercel a la lista de CORS ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://padel-club-manager.vercel.app',
  'https://padel-club-manager-qhy1hsl2y-eduardo-miguel-riccis-projects.vercel.app' // URL AÑADIDA
];
// --- FIN DE CORRECCIÓN 2 ---

app.use(cors({
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
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
  max: 200, // Límite de 200 peticiones por IP cada 10 min
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 10 minutos.',
});
app.use('/api', limiter);

// Rutas API
app.use('/api', routes);

// Configuración para servir estáticos en producción
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  // Si la ruta no es de la API, sirve el index.html
  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'))
  );
} else {
  app.get('/', (req, res) => {
    res.send('API is running in development mode...');
  });
}

// --- CORRECCIÓN 3: Comentamos el uso del middleware que falta ---
// app.use(logErrors);
// app.use(errorHandler);
// app.use(logger); 
// --- FIN DE CORRECCIÓN 3 ---

const PORT = process.env.PORT || 10000;

const server = http.createServer(app);

// Configurar Socket.IO
const io = setupSocketIO(server, allowedOrigins);
app.set('socketio', io); // Hacer 'io' accesible en los controladores

// Iniciar servidor
server.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  try {
    // Conectar a RabbitMQ al iniciar
    // const channel = await connectToRabbitMQ();
    // app.set('rabbitMQChannel', channel);
    // console.log('RabbitMQ connected and channel set in app.');
    
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
