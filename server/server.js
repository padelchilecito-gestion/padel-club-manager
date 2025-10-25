const express = require('express');
// const { logger, logErrors, errorHandler } = require('./middlewares/errorMiddleware'); // Comentado
const routes = require('./routes');
const { setupSocketIO } = require('./config/socket');
const { logActivity } = require('./utils/logActivity');
// const { connectToRabbitMQ } = require('./config/rabbitmq'); // Comentado
// const { setupScheduledTasks } = require('./utils/scheduler'); // Comentado
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path'); // Path sigue siendo necesario para otras cosas? Lo dejamos por ahora.
const http = require('http');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
// const { protect, admin } = require('./middlewares/authMiddleware'); // Middleware protect/admin no usado directamente aquí

// Cargar variables de entorno
dotenv.config();

// Forzar zona horaria
process.env.TZ = 'America/Argentina/Buenos_Aires';
console.log(`Timezone forced to: ${process.env.TZ}`);

// Conectar a MongoDB
connectDB();

const app = express();

// Configuración de CORS
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://padel-club-manager.vercel.app',
  'https://padel-club-manager-qhy1hsl2y-eduardo-miguel-riccis-projects.vercel.app',
  'https://padel-club-manager-55zprq1ag-eduardo-miguel-riccis-projects.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
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
app.use(helmet({ // Configuración básica de Helmet
  contentSecurityPolicy: false, // Deshabilitar CSP por ahora para simplificar, ajustar luego si es necesario
}));

// Loggeo de peticiones
// Asegúrate de que NODE_ENV esté configurado en Render si quieres logs solo en desarrollo
// O simplemente actívalo siempre:
app.use(morgan('dev'));

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
  windowMs: 10 * 60 * 1000,
  max: 200, // Ajusta según necesidad
  message: 'Demasiadas peticiones desde esta IP, por favor intente de nuevo en 10 minutos.',
  // trustProxy: 1 // Descomentar si Render usa un proxy inverso confiable
});
app.use('/api', limiter);

// Rutas API
app.use('/api', routes);

// --- BLOQUE ELIMINADO ---
// Ya no intentamos servir archivos estáticos desde el backend
// if (process.env.NODE_ENV === 'production') { ... }
// --- FIN DEL BLOQUE ELIMINADO ---

// Ruta raíz simple para verificar que la API funciona
app.get('/', (req, res) => {
  res.send('API Padel Club Manager está funcionando...');
});


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
    // Conexión RabbitMQ (comentada)
    // Tareas programadas (comentadas)
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
