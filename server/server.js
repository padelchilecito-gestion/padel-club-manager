require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');
const Setting = require('./models/Setting');

const startServer = async () => {
  // Conectar a la base de datos primero
  await connectDB();

  // NOTA IMPORTANTE: Se establece la zona horaria de Argentina como principal.
  // Esto es crucial para que todas las operaciones con fechas funcionen correctamente.
  process.env.TZ = 'America/Argentina/Buenos_Aires';
  console.log(`Timezone forced to: ${process.env.TZ}`);

  const app = express();
  app.set('trust proxy', 1);
  const server = http.createServer(app);

  // Configuración de CORS
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app',
    'https://padel-club-manager-6arn60r3x-eduardo-miguel-riccis-projects.vercel.app',
  ];

  const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(`CORS error: Origin ${origin} not allowed.`); // Log the rejected origin
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  app.use(express.json({ extended: false }));

  // Configuración de Socket.IO
  const io = new Server(server, {
    cors: corsOptions,
  });

  app.set('socketio', io);

  io.on('connection', (socket) => {
    console.log('A user connected via WebSocket');
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

 
  // Ruta de Health Check para Render
  app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.status(200).send('Padel Club Manager API is healthy');
  });

  // Definir Rutas

   // Definir Rutas

  app.use('/api', apiRoutes);

  const PORT = process.env.PORT || 5000;

  server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
};

startServer();
