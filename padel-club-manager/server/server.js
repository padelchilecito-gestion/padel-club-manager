const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');

// --- Seed Admin User ---
const seedAdminUser = async () => {
  try {
    const adminExists = await User.findOne({ role: 'Admin' });
    if (!adminExists) {
      await User.create({
        username: 'admin',
        password: 'password123', // In a real app, this should come from env vars
        role: 'Admin',
      });
      console.log('Admin user created: username="admin", password="password123"');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Connect to Database and Seed
const startServer = async () => {
  await connectDB();
  await seedAdminUser();
};
startServer();


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
app.use('/api', require('./routes'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => console.log(`Server started on port ${PORT}`));