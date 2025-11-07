import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const storedUser = localStorage.getItem('userInfo');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          // Set the auth token for all subsequent requests
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
        }
      } catch (error) {
        console.error("Failed to parse user info from localStorage", error);
        localStorage.removeItem('userInfo');
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  const login = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    setUser(null);
    delete apiClient.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'Admin',
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
