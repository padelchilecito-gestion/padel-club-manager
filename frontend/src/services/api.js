// frontend/src/services/api.js - CÓDIGO CORREGIDO

import axios from 'axios';

// Vercel usará la variable de entorno VITE_API_URL en producción.
// Si no existe (como en tu entorno local), usará la dirección de localhost.
const instance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export default instance;