// frontend/src/services/authService.js

import axios from 'axios';

// CORRECCIÓN: Volvemos a las rutas relativas. Vercel (vercel.json)
// se encargará de redirigirlas al backend.
const API_URL = '/api/auth'; // Para Login
const USER_API_URL = '/api/users'; // Para Registro y Perfil

// Función para iniciar sesión
export const loginUser = async (username, password) => { // <-- CORREGIDO (username)
    try {
        // Usar ruta relativa y 'username'
        const response = await axios.post(`${API_URL}/login`, { username, password });
        if (response.data.token) {
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
        // CORRECCIÓN: La ruta de registro está en USER_API_URL ('/api/users'), 
        // no en API_URL ('/api/auth').
        const response = await axios.post(USER_API_URL, userData); 
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
        // Usar ruta relativa
        const response = await axios.get(`${USER_API_URL}/profile`, config); 
        return response.data; // Debería devolver un objeto de usuario { id, name, email, role, etc. }
    } catch (error) {
        throw error;
    }
};
