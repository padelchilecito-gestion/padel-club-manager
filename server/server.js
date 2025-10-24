// (Líneas 1-27 sin cambios)
const { logger, logErrors, errorHandler } = require('./middlewares/errorMiddleware');
const routes = require('./routes');
const { setupSocketIO } = require('./config/socket');
const { logActivity } = require('./utils/logActivity');
const { connectToRabbitMQ } = require('./config/rabbitmq');
const { setupScheduledTasks } = require('./utils/scheduler');

// Cargar variables de entorno
dotenv.config();

// Forzar zona horaria (¡Importante!)
process.env.TZ = 'America/Argentina/Buenos_Aires';
console.log(`Timezone forced to: ${process.env.TZ}`);

// Conectar a MongoDB
connectDB();

const app = express();

// --- CORRECCIÓN DE CORS ---
// Añadimos la URL de Vercel que estaba dando error
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://padel-club-manager.vercel.app',
  'https://padel-club-manager-qhy1hsl2y-eduardo-miguel-riccis-projects.vercel.app' // URL AÑADIDA
];
// --- FIN DE CORRECCIÓN ---

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

// (El resto del archivo 'server.js' sigue igual...)
// ...
// (Líneas 44 en adelante sin cambios)
// ...
