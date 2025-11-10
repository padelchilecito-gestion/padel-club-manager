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

  // --- MODIFICACIÓN DE CORS ---
  // 1. Definimos la URL de Vercel explícitamente
  const vercelURL = 'https://padel-club-manager-xi.vercel.app';
  
  // 2. Creamos la lista de orígenes permitidos
  const allowedOrigins = [
    'http://localhost:5173', // Desarrollo local
    vercelURL, // Producción en Vercel
  ];

  // 3. Añadimos la CLIENT_URL de Render (si existe)
  // Esto es útil si Render tiene una URL de preview o si migras el front a Render
  if (process.env.CLIENT_URL && process.env.CLIENT_URL !== vercelURL) {
    allowedOrigins.push(process.env.CLIENT_URL);
  }
  // -----------------------------

  const corsOptions = {
    origin: function (origin, callback) {
      // Permitimos peticiones sin 'origin' (como Postman o apps móviles)
      // Y comprobamos si el 'origin' está en nuestra lista
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        console.error(`CORS Error: Origin ${origin} not allowed.`); // Logueamos el origen bloqueado
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };
  // -----------------------------

  app.use(cors(corsOptions));
  app.use(express.json({ extended: false }));

  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins, // Usamos la misma lista para Socket.IO
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true
    },
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
