// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import SimpleTimeSlotFinder from '../components/SimpleTimeSlotFinder'; // <-- Cambiado al nuevo componente
import { getSettings } from '../services/settingService';
import { FullPageLoading, ErrorMessage } from '../components/ui/Feedback';

const HomePage = () => {
  const [settings, setSettings] = useState(null); // Inicia como null
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // getSettings ahora devuelve un objeto { key: value }
        const data = await getSettings();
        
        // Validar que tengamos al menos la duración del slot
        if (!data.SLOT_DURATION) {
          setError('La configuración del club (duración del turno) no está completa. Contacta al administrador.');
        } else {
          setSettings(data); // Guardar todas las configuraciones cargadas
        }

      } catch (err) {
        console.error(err);
        setError(err.message || 'Error al cargar la configuración del club.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // --- Renderizado ---
  
  if (isLoading) {
    return <FullPageLoading text="Cargando configuración..." />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // Asegurarnos que settings no sea null antes de renderizar
  if (!settings) {
     return <FullPageLoading text="Inicializando..." />; // O algún otro estado intermedio
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg"> {/* Centrado y con ancho máximo */}
      <h1 className="text-3xl font-bold text-center text-purple-400 mb-8">
        Reserva tu Cancha de Pádel
      </h1>
      {/* Pasamos solo la duración del slot necesaria por ahora */}
      <SimpleTimeSlotFinder
        slotDuration={parseInt(settings.SLOT_DURATION, 10)}
      />
    </div>
  );
};

export default HomePage;
