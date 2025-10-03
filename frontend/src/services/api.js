import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the token on every request
apiClient.interceptors.request.use(
  (config) => {
    try {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo && userInfo.token) {
          config.headers['Authorization'] = `Bearer ${userInfo.token}`;
        }
    } catch (e) {
        console.error("Could not parse user info from local storage", e);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;