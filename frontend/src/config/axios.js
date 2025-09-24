import axios from 'axios';

// Determinar la URL base de la API según el entorno
const baseURL = import.meta.env.VITE_API_URL || 'https://padel-club-backend.onrender.com/api';

const axiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 10000, // 10 segundos de timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Opcional: Interceptor para añadir el token de autenticación si existe
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;