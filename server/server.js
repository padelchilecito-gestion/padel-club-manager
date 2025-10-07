require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const Setting = require('./models/Setting');

const startServer = async () => {
  // Connect to Database first
  await connectDB();

  // Set timezone from database
  try {
    const timezoneSetting = await Setting.findOne({ key: 'TIMEZONE' });
    if (timezoneSetting) {
      process.env.TZ = timezoneSetting.value;
      console.log(`Timezone set to: ${process.env.TZ}`);
    } else {
      // NOTA: Si no hay configuración en la base de datos, se establece una por defecto.
      process.env.TZ = 'America/Argentina/Buenos_Aires';
      console.log(`Default timezone set to: ${process.env.TZ}`);
    }
  } catch (error) {
    console.error('Could not set timezone from DB', error);
  }


  const app = express();
  app.set('trust proxy', 1);
  const server = http.createServer(app);

  // CORS configuration
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
    // NOTA: Esta opción es clave para solucionar el error de credenciales.
    credentials: true
  };

  app.use(cors(corsOptions));
  app.use(express.json({ extended: false }));

  // Socket.IO setup
  const io = new Server(server, {
    cors: corsOptions, // NOTA: Se usan las mismas opciones de CORS aquí.
  });

  app.set('socketio', io);

  io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  app.get('/', (req, res) => res.send('Padel Club Manager API Running'));

  // Define Routes
  app.use('/api', apiRoutes);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server started on port ${PORT}`);
  });
};

startServer();