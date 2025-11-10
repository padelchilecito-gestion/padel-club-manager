import React, { createContext, useState, useEffect, useContext } from 'react';
import { settingService } from '../services/settingService';

// 1. Crear el Contexto
const PublicSettingsContext = createContext(null);

// 2. Crear el Proveedor (Provider)
export const PublicSettingsProvider = ({ children }) => {
  const [publicSettings, setPublicSettings] = useState({
    businessHours: null,
    shopEnabled: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await settingService.getPublicSettings();
        setPublicSettings(settings);
      } catch (error) {
        console.error("Failed to load public settings", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const value = {
    settings: publicSettings,
    isLoading: loading,
  };

  return (
    <PublicSettingsContext.Provider value={value}>
      {!loading && children}
    </PublicSettingsContext.Provider>
  );
};

// 3. Crear el Hook para consumir el contexto
export const usePublicSettings = () => {
  const context = useContext(PublicSettingsContext);
  if (!context) {
    throw new Error('usePublicSettings must be used within a PublicSettingsProvider');
  }
  return context;
};
