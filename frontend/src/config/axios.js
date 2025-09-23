import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://padel-club-backend.onrender.com/api';

// Crear instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Interceptor para requests
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para responses
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`✅ Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response error:', error);

    if (error.code === 'ERR_NETWORK') {
      console.error('🌐 Network error - posible problema de CORS o servidor inactivo');
    }

    if (error.response?.status === 0) {
      console.error('🚫 CORS error - el servidor no está permitiendo el origen');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
