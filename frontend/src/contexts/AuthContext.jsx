// frontend/src/contexts/AuthContext.jsx (CORREGIDO)
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
// Importamos los servicios actualizados (sin manejo de token)
import { loginUser, registerUser, getUserProfile, logoutUser, checkAuthStatus } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true); // Empezamos en true
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // loadUser ahora verifica la cookie llamando al endpoint /check
  const loadUser = useCallback(async () => {
    try {
      setAuthLoading(true);
      // checkAuthStatus usa la cookie httpOnly automáticamente
      const profile = await checkAuthStatus();
      setUser(profile);
      setError(null);
    } catch (err) {
      setUser(null);
      // No seteamos error aquí, es normal no estar logueado
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (username, password) => {
    setAuthLoading(true);
    setError(null);
    try {
      // 1. loginUser ahora setea la cookie
      const profile = await loginUser(username, password);
      
      // 2. Seteamos el usuario en el estado
      setUser(profile);

      // 3. Redirigir
      const from = location.state?.from?.pathname || '/';
      if (profile.role === 'Admin' || profile.role === 'Operator') {
        navigate('/admin');
      } else if (from !== '/login' && from !== '/') {
        navigate(from);
      } else {
        navigate('/');
      }
      return profile;
    } catch (err) {
      const errorMessage = err.message || 'Error de inicio de sesión.';
      setError(errorMessage);
      setUser(null); // Asegurarse de que no hay usuario
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const register = async (userData) => {
    setAuthLoading(true);
    setError(null);
    try {
      // registerUser también setea la cookie
      const profile = await registerUser(userData);
      setUser(profile);
      navigate('/');
      return profile;
    } catch (err) {
      const errorMessage = err.message || 'Error de registro.';
      setError(errorMessage);
      setUser(null);
      throw new Error(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      await logoutUser(); // Llama al backend para limpiar la cookie
    } catch (err) {
      console.error("Error al hacer logout:", err);
    } finally {
      setUser(null);
      setError(null);
      navigate('/');
    }
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
