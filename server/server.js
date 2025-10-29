// padelchilecito-gestion/padel-club-manager/padel-club-manager-e1b54ee9b27c8f286a95c978589cf18147777fb5/server/server.js
const express = require('express');
const routes = require('./routes');
const { setupSocketIO } = require('./config/socket');
const { logActivity } = require('./utils/logActivity');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const path = require('path');
const http = require('http');
const cookieParser = require('cookie-parser');

// Cargar variables de entorno
dotenv.config();

// Forzar zona horaria
process.env.TZ = 'America/Argentina/Buenos_Aires';
console.log(`Timezone forced to: ${process.env.TZ}`);

// Conectar a MongoDB
connectDB();

const app = express();

app.set('trust proxy', 1);

// --- INICIO DE LA SOLUCIÓN DE CORS (CORREGIDA) ---

// Lista de orígenes permitidos
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://padel-club-manager.vercel.app', // Tu dominio principal
  'https://padel-club-manager-xi.vercel.app',
  // Esta Expresión Regular acepta CUALQUIER URL que comience con 'padel-club-manager-'
  // y termine en '.vercel.app'. Esto incluye:
  // - ...-xi.vercel.app
  // - ...-c6koi7qcd-eduardo-miguel-riccis-projects.vercel.app
  // - y cualquier otra que Vercel genere en el futuro.
  /^https:\/\/padel-club-manager-.*\.vercel\.app$/
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin 'origin' (como Postman o apps móviles)
    if (!origin) {
      return callback(null, true);
    }
    
    // Comprobar si el 'origin' coincide con la lista
    let originIsAllowed = false;
    for (const allowed of allowedOrigins) {
      if (typeof allowed === 'string' && allowed === origin) {
        originIsAllowed = true;
        break;
      }
      if (allowed instanceof RegExp && allowed.test(origin)) {
        originIsAllowed = true;
        break;
      }
    }

    if (originIsAllowed) {
      callback(null, true);
    } else {
      console.error(`CORS error: Origin ${origin} not allowed.`);
      callback(new Error(`Origin ${origin} Not allowed by CORS`));
    }
  },
  credentials: true,
}));
// --- FIN DE LA SOLUCIÓN DE CORS ---


// Body parser, cookie parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Rutas API
app.use('/api', routes);

// Ruta raíz simple para verificar que la API funciona
app.get('/', (req, res) => {
  res.send('API Padel Club Manager está funcionando...');
});

const PORT = process.env.PORT || 10000;

const server = http.createServer(app);

// Configurar Socket.IO (pasamos la misma lista de orígenes)
const io = setupSocketIO(server, allowedOrigins);
app.set('socketio', io);

// Iniciar servidor
server.listen(PORT, async () => {
  console.log(`Server started on port ${PORT}`);
  try {
    // ...
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
