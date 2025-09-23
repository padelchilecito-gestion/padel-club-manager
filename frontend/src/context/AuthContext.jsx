import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

// --- CAMBIO CLAVE: Usar una ruta relativa para la API ---
// Esto funcionará tanto en desarrollo (con el proxy de Vite) como en producción (con Vercel).
axios.defaults.baseURL = '/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole');
        if (token && role) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUserRole(role);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/auth/login', { username, password });
            const { token, role } = response.data;
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', role);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUserRole(role);
            return true;
        } catch (error) {
            console.error('Error de inicio de sesión:', error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        delete axios.defaults.headers.common['Authorization'];
        setUserRole(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-dark-primary">Cargando sesión...</div>;
    }

    return (
        <AuthContext.Provider value={{ isAdmin: userRole === 'Admin', userRole, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);