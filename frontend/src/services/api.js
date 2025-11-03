// frontend/src/services/api.js (CORREGIDO)
import axios from 'axios';

// En producción (Vercel), usaremos una ruta relativa '/api'.
const PROD_API_URL = '/api';
// En desarrollo, usamos el puerto 5000 (corregido en un paso anterior)
const DEV_API_URL = 'http://localhost:5000/api';

const baseUrl = import.meta.env.PROD ? PROD_API_URL : DEV_API_URL;

const api = axios.create({
  baseURL: baseUrl,
  withCredentials: true, // <-- MUY IMPORTANTE: Esto permite que se envíen las cookies
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('No autorizado (401). Redirigiendo a login...');
      
      // --- INICIO DE LA CORRECCIÓN ---
      // El token está en localStorage, debemos limpiarlo para romper el bucle.
      // El error era que decía 'user' en lugar de 'token'.
      localStorage.removeItem('token'); 
      // --- FIN DE LA CORRECCIÓN ---

      // Redirige si no está ya en login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
