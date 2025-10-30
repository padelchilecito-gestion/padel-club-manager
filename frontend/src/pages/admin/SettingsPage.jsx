// frontend/src/pages/admin/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
// CORRECCIÓN 1: Importar el servicio de configuración (settingService)
import settingService from '../../services/settingService'; 
import { FullPageLoading, ErrorMessage } from '../../components/ui/Feedback';

const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // 'success', 'error', ''

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setSaveStatus('');
        
        // CORRECCIÓN 2: Llamar a la función como 'settingService.getSettings()'
        const settingsData = await settingService.getSettings(); 
        
        setSettings(settingsData || {});
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error al cargar la configuración.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prevSettings => ({
      ...prevSettings,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setSaveStatus('');
    setError(null);
    
    try {
      // (Asumiendo que tienes un 'updateSettings' en tu servicio)
      // Reemplaza esto con tu función real si es diferente
      // await settingService.updateSettings(settings); 
      
      // *** Mockup si 'updateSettings' no existe aún en el servicio ***
      // Esta es una simulación. Necesitarás implementar la función en settingService.js
      // y la ruta PUT/POST en el backend para que guarde de verdad.
      console.log('Guardando configuración (simulado):', settings);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular espera de red
      // --- Fin Simulación ---

      setSaveStatus('success');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Error al guardar la configuración.');
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSaveStatus(''), 3000); // Limpiar mensaje de estado
    }
  };

  if (isLoading && !Object.keys(settings).length) {
    return <FullPageLoading text="Cargando configuración..." />;
  }

  if (error && !Object.keys(settings).length) {
    return (
      <div className="flex items-center justify-center h-64">
        <ErrorMessage message={error} />
      </div>
    );
  }

  const renderStatusMessage = () => {
    if (saveStatus === 'success') {
      return <div className="text-green-400">Configuración guardada con éxito.</div>;
    }
    if (saveStatus === 'error') {
      return <ErrorMessage message={error || 'Error al guardar.'} />;
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-3xl font-bold text-purple-400 mb-8">
        Configuración del Club
      </h1>
      
      {error && <ErrorMessage message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg">
        
        {/* Duración del Turno */}
        <div>
          <label htmlFor="SLOT_DURATION" className="block text-sm font-medium text-gray-400 mb-1">
            Duración del Turno (en minutos)
          </label>
          <input
            type="number"
            id="SLOT_DURATION"
            name="SLOT_DURATION"
            value={settings.SLOT_DURATION || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Ej. 60"
          />
        </div>

        {/* Moneda */}
        <div>
          <label htmlFor="CURRENCY" className="block text-sm font-medium text-gray-400 mb-1">
            Símbolo de Moneda
          </label>
          <input
            type="text"
            id="CURRENCY"
            name="CURRENCY"
            value={settings.CURRENCY || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Ej. $"
          />
        </div>

        {/* WhatsApp del Club */}
        <div>
          <label htmlFor="CLUB_WHATSAPP" className="block text-sm font-medium text-gray-400 mb-1">
            Número de WhatsApp (con código de país)
          </label>
          <input
            type="text"
            id="CLUB_WHATSAPP"
            name="CLUB_WHATSAPP"
            value={settings.CLUB_WHATSAPP || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="Ej. 5493825123456"
          />
        </div>

        {/* Link de Mercado Pago */}
        <div>
          <label htmlFor="MP_LINK" className="block text-sm font-medium text-gray-400 mb-1">
            Link de Pago (Mercado Pago u otro)
          </label>
          <input
            type="text"
            id="MP_LINK"
            name="MP_LINK"
            value={settings.MP_LINK || ''}
            onChange={handleChange}
            className="w-full px-3 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
            placeholder="https://mpago.la/..."
          />
        </div>

        {/* Botón de Guardar */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 font-semibold text-white bg-purple-600 rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            {isLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
          
          <div className="min-h-[1.5em]">
            {renderStatusMessage()}
          </div>
        </div>

      </form>
    </div>
  );
};

export default SettingsPage;
