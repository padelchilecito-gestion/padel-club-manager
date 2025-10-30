// frontend/src/services/authService.js

import axios from 'axios';
// CORRECCIÓN: Quitamos api.js y usamos axios directo con la URL completa
// porque 'api.js' (el interceptor) aún no tiene el token de autorización 
// en el momento del login. Esto evita problemas de URL duplicada (/api/api).
const API_URL_BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${API_URL_BASE}/api/auth`; 
const USER_API_URL = `${API_URL_BASE}/api/users`;

// Función para iniciar sesión
export const loginUser = async (username, password) => { // <-- CORREGIDO (username)
    try {
        // CORREGIDO: Usar axios.post y enviar 'username'
        const response = await axios.post(`${API_URL}/login`, { username, password }); 
        if (response.data.token) {
            // Guardar el token en localStorage es opcional aquí si ya lo manejas en AuthContext
            // localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error; // Re-lanza el error para que el AuthContext lo maneje
    }
};

// Función para registrar un nuevo usuario
export const registerUser = async (userData) => {
    try {
        // CORREGIDO: Usar axios.post
        const response = await axios.post(`${API_URL}/register`, userData);
        if (response.data.token) {
            // localStorage.setItem('token', response.data.token);
        }
        return response.data;
    } catch (error) {
        throw error;
    }
};

// **FUNCIÓN CORREGIDA: Obtener el perfil del usuario**
// Añadimos 'export' para que AuthContext.jsx pueda importarla
export const getUserProfile = async (token) => {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        // CORREGIDO: Usar axios.get
        // Asumiendo que tienes un endpoint como /api/users/profile que devuelve el perfil del usuario
        const response = await axios.get(`${USER_API_URL}/profile`, config); 
        return response.data; // Debería devolver un objeto de usuario { id, name, email, role, etc. }
    } catch (error) {
        throw error;
    }
};

// Ya no necesitamos la exportación por defecto (default export)
// const authService = {
//     loginUser,
//     registerUser,
//     getUserProfile,
// };
// export default authService;
