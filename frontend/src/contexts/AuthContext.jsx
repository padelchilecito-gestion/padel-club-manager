// frontend/src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom'; // Importar useLocation
import { loginUser, registerUser, getUserProfile } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation(); // Hook para acceder a la ubicación actual

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        setAuthLoading(true);
        const profile = await getUserProfile(token);
        setUser(profile);
        setError(null);
      } catch (err) {
        console.error("Error al cargar perfil de usuario:", err);
        setError(err.message || "Error al cargar el perfil de usuario.");
        localStorage.removeItem('token'); // Token inválido o expirado
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    } else {
      setUser(null);
      setAuthLoading(false);
    }
  }, []); // Dependencias vacías, loadUser no necesita ser recreado

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // CORREGIDO: Aceptar 'username' en lugar de 'email'
  const login = async (username, password) => { 
    setAuthLoading(true);
    setError(null);
    try {
      // CORREGIDO: Pasar 'username'
      const data = await loginUser(username, password); 
      localStorage.setItem('token', data.token);
      
      // Recargar usuario inmediatamente para tener el rol actualizado
      const profile = await getUserProfile(data.token); 
      setUser(profile); // Actualizar el estado del usuario aquí

      // Redirigir basado en el rol del usuario que ACABA de loguearse
      const from = location.state?.from?.pathname || '/';
      if (profile.role === 'Admin' || profile.role === 'Operator') {
        navigate('/admin'); // Siempre ir a admin si es admin/operator
      } else if (from !== '/login' && from !== '/') {
        navigate(from); // Ir a la página previa si no era login o inicio
      } else {
        navigate('/'); // Por defecto al inicio para usuarios normales o si 'from' era login/inicio
      }
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de inicio de sesión.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (userData) => {
    setAuthLoading(true);
    setError(null);
    try {
      const data = await registerUser(userData);
      localStorage.setItem('token', data.token);
      await loadUser();
      navigate('/'); 
      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error de registro.';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
    navigate('/');
  }, [navigate]);

  const value = {
    user,
    authLoading,
    error,
    login,
    register,
    logout,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
