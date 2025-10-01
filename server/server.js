const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Init Middleware
app.use(cors());
app.use(express.json({ extended: false }));

// Socket.IO setup
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173", // URL del cliente
    methods: ["GET", "POST"]
  }
});

// Global variable for io
app.set('socketio', io);

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

app.get('/', (req, res) => res.send('Padel Club Manager API Running'));

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courts', require('./routes/courts'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/products', require('./routes/products'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/cashbox', require('./routes/cashbox'));
app.use('/api/payments', require('./routes/payments'));
// app.use('/api/reports', require('./routes/reports'));
// app.use('/api/logs', require('./routes/logs'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));