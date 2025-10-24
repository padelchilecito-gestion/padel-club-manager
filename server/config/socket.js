// server/config/socket.js (NUEVO ARCHIVO)

const { Server } = require('socket.io');

const setupSocketIO = (server, allowedOrigins) => {
  const io = new Server(server, {
    pingTimeout: 60000, // Tiempo de espera antes de desconectar si no hay respuesta
    cors: {
      origin: allowedOrigins, // Usa los mismos orígenes permitidos que tu config de CORS
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  console.log('Socket.IO configurado.');

  io.on('connection', (socket) => {
    console.log(`Socket conectado: ${socket.id}`);

    // Aquí puedes añadir listeners para eventos específicos si los necesitas
    // Ejemplo:
    // socket.on('join_room', (roomId) => {
    //   socket.join(roomId);
    //   console.log(`Socket ${socket.id} se unió a la sala ${roomId}`);
    // });

    socket.on('disconnect', () => {
      console.log(`Socket desconectado: ${socket.id}`);
    });
  });

  return io; // Devuelve la instancia de 'io' para usarla en server.js
};

module.exports = { setupSocketIO };
