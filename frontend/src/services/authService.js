import apiClient from './api';

const login = async (username, password) => {
  try {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  } catch (error) {
    console.error('Login failed:', error.response?.data?.message || error.message);
    throw error.response?.data || error;
  }
};

const register = async (userData) => {
    try {
        // This endpoint is protected, so the token from the logged-in admin is sent automatically by the interceptor
        const response = await apiClient.post('/users/register', userData);
        return response.data;
    } catch (error) {
        console.error('Registration failed:', error.response?.data?.message || error.message);
        throw error.response?.data || error;
    }
}

export const authService = {
  login,
  register,
};