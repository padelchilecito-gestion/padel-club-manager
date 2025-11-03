// frontend/src/services/authService.js (CORREGIDO)
import api from './api';

const AUTH_API_URL = '/auth';

/**
 * Inicia sesión de un usuario.
 * El token se recibirá como una cookie httpOnly, no en la respuesta JSON.
 */
export const loginUser = async (username, password) => {
  try {
    // La respuesta de login ahora solo devuelve datos del usuario
    const { data } = await api.post(`${AUTH_API_URL}/login`, { username, password });
    return data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Registra un nuevo usuario.
 * El token se recibirá como una cookie httpOnly.
 */
export const registerUser = async (userData) => {
  try {
    const { data } = await api.post(`${AUTH_API_URL}/register`, userData);
    return data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Obtiene el perfil del usuario autenticado.
 * No se necesita 'token' como argumento, la cookie se envía automáticamente.
 */
export const getUserProfile = async () => {
  try {
    const { data } = await api.get(`${AUTH_API_URL}/profile`);
    return data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Cierra la sesión del usuario.
 * El backend se encargará de limpiar la cookie.
 */
export const logoutUser = async () => {
  try {
    const { data } = await api.post(`${AUTH_API_URL}/logout`);
    return data;
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};

/**
 * Verifica el estado de autenticación (usado para cargar la app).
 * La cookie se envía automáticamente.
 */
export const checkAuthStatus = async () => {
  try {
    const { data } = await api.get(`${AUTH_API_URL}/check`);
    return data; // Devuelve el usuario si la cookie es válida
  } catch (error) {
    throw error.response?.data?.message || error.message;
  }
};
