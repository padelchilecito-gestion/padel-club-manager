import React, { useState, useEffect } from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder';
import { getSettings } from '../services/settingService';
import { FullPageLoading, ErrorMessage } from '../components/ui/Feedback';

const HomePage = () => {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null); // Limpiamos error anterior
        const data = await getSettings();
        setSettings(data);
        
        // --- LÓGICA DE VALIDACIÓN CORREGIDA ---
        // Solo validamos DESPUÉS de cargar los datos
        if (!data.openTime || !data.closeTime || !data.slotDuration) {
          setError('La configuración del club no está completa. Por favor, contacta al administrador.');
        }
      } catch (err) {
        console.error(err);
        // Si el error es 500, mostramos un mensaje genérico
        if (err.response && err.response.status === 500) {
          setError('No se pudo cargar la configuración del club. Intente más tarde.');
        } else {
          // Si es otro error (ej. 404), mostramos el mensaje de la API
          setError(err.message || 'Error al cargar la configuración.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // --- BLOQUE DE RETURN CORREGIDO ---
  
  // 1. Mostrar carga mientras isLoading sea true
  if (isLoading) {
    return <FullPageLoading text="Cargando configuración del club..." />;
  }

  // 2. Mostrar error si existe (después de cargar)
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <ErrorMessage message={error} />
      </div>
    );
  }

  // 3. Si no hay carga y no hay error, mostrar el componente
  return (
    <div>
      <h1 className="text-3xl font-bold text-center text-white mb-8">
        Reserva tu Cancha
      </h1>
      <TimeSlotFinder
        settings={settings}
      />
    </div>
  );
};

export default HomePage;
