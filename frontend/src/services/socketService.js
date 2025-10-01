import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const socket = io(SOCKET_URL, {
  autoConnect: false, // We will connect manually when needed
  withCredentials: true
});

// Optional: for debugging purposes
socket.onAny((event, ...args) => {
  console.log('Socket event received:', event, args);
});

export default socket;
