import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
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
