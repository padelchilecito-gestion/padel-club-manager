// frontend/src/services/api.js (CORREGIDO)
import axios from 'axios';

// CORRECCIÓN:
// En producción (Vercel), usaremos una ruta relativa '/api'.
// Vercel (via vercel.json) interceptará esto y lo redirigirá
// a 'https://padel-club-backend.onrender.com/api'.
const PROD_API_URL = '/api';

// --- INICIO DE LA CORRECCIÓN ---
// Se cambió el puerto de 5001 a 5000 para coincidir con el server/server.js
const DEV_API_URL = 'http://localhost:5000/api';
// --- FIN DE LA CORRECCIÓN ---


// Usamos la variable interna de Vite (import.meta.env.PROD)
// para decidir qué URL usar.
const baseUrl = import.meta.env.PROD ? PROD_API_URL : DEV_API_URL;

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Manejar la no autorización (ej. limpiar localStorage, redirigir a login)
      console.error('No autorizado. Redirigiendo a login...');
      localStorage.removeItem('user'); // O tu clave de token/usuario
      // Redirige si no está ya en login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
