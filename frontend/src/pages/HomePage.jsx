// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import SimpleTimeSlotFinder from '../components/SimpleTimeSlotFinder';
import { getSettings } from '../services/settingService';
import { FullPageLoading, ErrorMessage } from '../components/ui/Feedback';

const HomePage = () => {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await getSettings();
        
        // Añadimos CLUB_WHATSAPP como requisito para la reserva
        if (!data.SLOT_DURATION || !data.CURRENCY || !data.CLUB_WHATSAPP) { 
          setError('La configuración del club (duración del turno, moneda o WhatsApp) no está completa. Contacta al administrador.');
        } else {
          setSettings(data);
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

  if (!settings) {
     return <FullPageLoading text="Inicializando..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-lg">
      <h1 className="text-3xl font-bold text-center text-purple-400 mb-8">
        Reserva tu Cancha de Pádel
      </h1>
      <SimpleTimeSlotFinder
        slotDuration={parseInt(settings.SLOT_DURATION, 10)}
        currency={settings.CURRENCY || '$'}
        clubWhatsApp={settings.CLUB_WHATSAPP} // Pasar el número de WhatsApp
        // Otras configuraciones relevantes, por ejemplo, un precio base por hora
        // basePricePerHour={parseFloat(settings.BASE_PRICE_PER_HOUR || 0)} 
        // Puedes pasar el objeto 'settings' completo si es más conveniente
        // clubSettings={settings}
      />
    </div>
  );
};

export default HomePage;
