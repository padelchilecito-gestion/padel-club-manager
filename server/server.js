require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const apiRoutes = require('./routes');

const startServer = async () => {
  // Connect to Database first
  await connectDB();

  const app = express();
  const server = http.createServer(app);

  // --- Configuración de Orígenes Permitidos (para HTTP) ---
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'https://padel-club-manager-xi.vercel.app',
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

  // --- MODIFICACIÓN DE SOCKET.IO (REVERTIDA A LA VERSIÓN CORRECTA) ---
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins, // <-- Usamos la lista explícita, NO el wildcard "*"
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
  });
  // ---------------------------------

  app.set('socketio', io);

  io.on('connection', (socket) => {
    console.log(`A user connected via WebSocket (Origin: ${socket.handshake.headers.origin})`);
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
