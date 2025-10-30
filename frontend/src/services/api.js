// frontend/src/services/api.js
import axios from 'axios';

const api = axios.create({
  // CORRECCIÓN 1: Usar la ruta relativa base.
  // Tu vercel.json redirige "/api/(.*)".
  // Por lo tanto, la baseURL debe ser simplemente '/api'.
  baseURL: '/api' 
});

// CORRECCIÓN 2: Añadir un interceptor de peticiones (request).
// Esto es CRÍTICO. Adjunta el token JWT (guardado en localStorage
// durante el login) a CADA petición que use esta instancia 'api'.
api.interceptors.request.use(
  (config) => {
    // Obtener el token de localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      // Si el token existe, añadirlo a la cabecera de autorización
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    // Manejar errores en la configuración de la petición
    return Promise.reject(error);
  }
);

// OPCIONAL PERO RECOMENDADO: Interceptor de respuesta (response)
// Esto maneja el caso en que el token expire.
api.interceptors.response.use(
  (response) => response, // Si la respuesta es OK (2xx), solo la devuelve
  (error) => {
    // Si la respuesta es un error
    if (error.response && error.response.status === 401) {
      // Si el error es 401 (No Autorizado), ej. token expirado
      localStorage.removeItem('token'); // Limpiar el token viejo
      
      // Forzar al usuario a la página de login
      // Usamos window.location porque no podemos usar hooks de React aquí.
      if (window.location.pathname !== '/login') {
         window.location.href = '/login';
      }
    }
    // Devolver el error para que el 'catch' del servicio (ej. reportService) lo maneje
    return Promise.reject(error);
  }
);

export default api;
