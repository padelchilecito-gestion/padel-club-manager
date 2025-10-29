// frontend/src/pages/admin/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/settingService';
import toast from 'react-hot-toast';
import { FullPageLoading, ErrorMessage } from '../../components/ui/Feedback';

// --- NUEVA LÓGICA DE UI ---

// Claves para el formulario de horarios
const daysOfWeek = [
  { key: 'MONDAY', label: 'Lunes' },
  { key: 'TUESDAY', label: 'Martes' },
  { key: 'WEDNESDAY', label: 'Miércoles' },
  { key: 'THURSDAY', label: 'Jueves' },
  { key: 'FRIDAY', label: 'Viernes' },
  { key: 'SATURDAY', label: 'Sábado' },
  { key: 'SUNDAY', label: 'Domingo' },
];

// Lista de *todas* las claves que maneja el formulario de horarios
const newScheduleKeys = [
  'SLOT_DURATION',
  ...daysOfWeek.flatMap(day => [
    `${day.key}_IS_OPEN`,
    `${day.key}_OPENING_HOUR`,
    `${day.key}_CLOSING_HOUR`
  ])
];

// Lista de claves *viejas* que queremos ignorar en la pestaña "Avanzada"
const oldScheduleKeys = [
  'WEEKDAY_OPENING_HOUR',
  'WEEKDAY_CLOSING_HOUR',
  'WEEKEND_OPENING_HOUR',
  'WEEKEND_CLOSING_HOUR',
  'openTime', // Clave genérica vieja
  'closeTime', // Clave genérica vieja
  'slotDuration' // Clave vieja en minúsculas
];
// --- FIN LÓGICA DE UI ---


const SettingsPage = () => {
  const [formData, setFormData] = useState({});
  const [activeTab, setActiveTab] = useState('horarios'); // 'horarios' o 'avanzada'
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cargar configuraciones existentes
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await getSettings(); // Devuelve { KEY: VALUE }
        
        // Inicializar el estado del formulario con los valores de la DB
        // Aseguramos que los valores 'IS_OPEN' sean booleanos para los checkboxes
        const processedSettings = { ...settings };
        daysOfWeek.forEach(day => {
          const key = `${day.key}_IS_OPEN`;
          processedSettings[key] = settings[key] === 'true'; // Convertir string 'true' a boolean
        });
        
        setFormData(processedSettings);
        
      } catch (err) {
        console.error(err);
        setError('No se pudo cargar la configuración.');
        toast.error('Error al cargar la configuración.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      // Los checkboxes guardan boolean, el resto guarda el valor
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Convertir el objeto formData al array que espera el backend
    // Aseguramos que los booleanos 'IS_OPEN' se guarden como string 'true'/'false'
    const settingsToSave = Object.keys(formData).map(key => {
      let value = formData[key];
      // Si es una clave de 'IS_OPEN', convertir boolean a string
      if (key.endsWith('_IS_OPEN')) {
        value = value ? 'true' : 'false';
      }
      
      return {
        key: key,
        value: value || '' // Enviar string vacío si es null/undefined
      };
    });

    try {
      await updateSettings(settingsToSave);
      toast.success('Configuración guardada con éxito.');
    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Error al guardar la configuración.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // --- RENDERIZADO ---

  if (isLoading) {
    return <FullPageLoading text="Cargando configuración..." />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  // Filtrar claves para la pestaña "Avanzada"
  const otherSettingsKeys = Object.keys(formData).filter(
    key => 
      !newScheduleKeys.includes(key) && // No es una clave de horario NUEVA
      !oldScheduleKeys.includes(key) && // No es una clave de horario VIEJA
      key !== '__v' && key !== '_id' // Excluir claves internas
  );

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-6">Configuración del Club</h1>

      {/* Pestañas */}
      <div className="mb-6 border-b border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('horarios')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'horarios'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            Horarios
          </button>
          <button
            onClick={() => setActiveTab('avanzada')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'avanzada'
                ? 'border-yellow-500 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'
            }`}
          >
            Configuración Avanzada
          </button>
        </nav>
      </div>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg">
        
        {/* Contenido Pestaña Horarios */}
        <div className={activeTab === 'horarios' ? 'block' : 'hidden'}>
          <div className="space-y-6">
            <div>
              <label htmlFor="SLOT_DURATION" className="block text-sm font-medium text-gray-300">
                Duración del Turno (en minutos)
              </label>
              <input
                type="number"
                name="SLOT_DURATION"
                id="SLOT_DURATION"
                value={formData.SLOT_DURATION || ''}
                onChange={handleChange}
                className="mt-1 block w-full max-w-xs bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Ej: 60"
              />
            </div>
            
            <hr className="border-gray-700" />
            
            {/* Formulario por día */}
            <div className="space-y-4">
              {daysOfWeek.map(day => {
                const isOpenKey = `${day.key}_IS_OPEN`;
                const openKey = `${day.key}_OPENING_HOUR`;
                const closeKey = `${day.key}_CLOSING_HOUR`;
                const isChecked = formData[isOpenKey] === true;

                return (
                  <div key={day.key} className="p-4 bg-gray-900 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium text-gray-200">{day.label}</span>
                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name={isOpenKey}
                          checked={isChecked}
                          onChange={handleChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-cyan-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
                        <span className="ml-3 text-sm font-medium text-gray-300">
                          {isChecked ? 'Abierto' : 'Cerrado'}
                        </span>
                      </label>
                    </div>
                    
                    {/* Inputs de Hora (condicionales) */}
                    {isChecked && (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor={openKey} className="block text-sm font-medium text-gray-400">
                            Apertura
                          </label>
                          <input
                            type="time"
                            name={openKey}
                            id={openKey}
                            value={formData[openKey] || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label htmlFor={closeKey} className="block text-sm font-medium text-gray-400">
                            Cierre
                          </label>
                          <input
                            type="time"
                            name={closeKey}
                            id={closeKey}
                            value={formData[closeKey] || ''}
                            onChange={handleChange}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Contenido Pestaña Avanzada */}
        <div className={activeTab === 'avanzada' ? 'block' : 'hidden'}>
           <div className="space-y-4">
            {otherSettingsKeys.length > 0 ? (
              otherSettingsKeys.map(key => (
                <div key={key}>
                  <label htmlFor={key} className="block text-sm font-medium text-gray-300 capitalize">
                    {key.replace(/_/g, ' ')}
                  </label>
                  <input
                    type="text"
                    name={key}
                    id={key}
                    value={formData[key] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 sm:text-sm"
                    placeholder={`Valor para ${key}`}
                  />
                </div>
              ))
            ) : (
              <p className="text-gray-400">No hay configuraciones avanzadas cargadas.</p>
            )}
           </div>
        </div>

        {/* --- Botón de Guardar (siempre visible) --- */}
        <div className="mt-8 flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
              isSaving
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500'
            }`}
          >
            {isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
