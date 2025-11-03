// server/server.js
const express = require('express');
const dotenv = require('dotenv');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const { setupSocketIO } = require('./config/socket');
const allRoutes = require('./routes/index');
const { errorHandler, notFound } = require('./middlewares/errorMiddleware');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// CORS Configuration
const clientURL = process.env.CLIENT_URL;
const allowedOrigins = [clientURL, 'http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
};

app.use(cors(corsOptions));

// Express Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser()); // Use cookie-parser

// API Routes
app.use('/api', allRoutes);

// Welcome Route
app.get('/', (req, res) => {
  res.send('Padel Club Manager API is running.');
});

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io
const io = setupSocketIO(server, allowedOrigins);
app.set('socketio', io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
