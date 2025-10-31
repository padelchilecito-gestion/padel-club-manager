import axios from 'axios';

// URLs base fijas para producción y desarrollo
const PROD_API_URL = 'https://padel-club-backend.onrender.com/api';
const DEV_API_URL = 'http://localhost:5001/api';

// Usamos la variable interna de Vite (import.meta.env.PROD)
// para decidir qué URL usar.
// Si (import.meta.env.PROD) es true (corriendo en Vercel/Producción), usa PROD_API_URL.
// Si es false (corriendo en local), usa DEV_API_URL.
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
