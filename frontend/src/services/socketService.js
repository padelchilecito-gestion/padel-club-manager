import { io } from 'socket.io-client';

// 1. Obtener la URL de la API (ej: https://padel-club-backend.onrender.com/api)
const API_URL = import.meta.env.VITE_API_URL;

// 2. Deducir la URL base del socket
let SOCKET_URL;
if (API_URL) {
  // Si VITE_API_URL es "https://.../api", le quitamos el "/api"
  SOCKET_URL = API_URL.replace('/api', ''); 
} else {
  // Fallback para localhost
  SOCKET_URL = 'http://localhost:5000';
}

// Ahora SOCKET_URL será "https://padel-club-backend.onrender.com"
// y se conectará correctamente a la raíz.

const socket = io(SOCKET_URL, {
  autoConnect: false, // Nos conectaremos manualmente cuando sea necesario
  withCredentials: true
});

// Opcional: para depuración
socket.onAny((event, ...args) => {
  console.log('Socket event received:', event, args);
});

export default socket;
