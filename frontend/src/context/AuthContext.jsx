import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    // Almacenamos el rol además del estado de admin
    const [userRole, setUserRole] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('userRole'); // Recuperamos el rol
        if (token && role) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            setUserRole(role);
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const response = await axios.post('/auth/login', { username, password });
            const { token, role } = response.data; // Obtenemos el rol desde la respuesta
            localStorage.setItem('token', token);
            localStorage.setItem('userRole', role); // Guardamos el rol
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
        localStorage.removeItem('userRole'); // Limpiamos el rol
        delete axios.defaults.headers.common['Authorization'];
        setUserRole(null);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen bg-dark-primary">Cargando sesión...</div>;
    }

    // Pasamos el rol al provider
    return (
        <AuthContext.Provider value={{ isAdmin: userRole === 'Admin', userRole, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);