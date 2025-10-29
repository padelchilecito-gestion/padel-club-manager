// frontend/src/pages/admin/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/settingService';
import toast from 'react-hot-toast';
import { FullPageLoading, ErrorMessage } from '../../components/ui/Feedback';

// Definir los días de la semana para el formulario
const daysOfWeek = [
  { key: 'MONDAY', label: 'Lunes' },
  { key: 'TUESDAY', label: 'Martes' },
  { key: 'WEDNESDAY', label: 'Miércoles' },
  { key: 'THURSDAY', label: 'Jueves' },
  { key: 'FRIDAY', label: 'Viernes' },
  { key: 'SATURDAY', label: 'Sábado' },
  { key: 'SUNDAY', label: 'Domingo' },
];

// Claves que se manejan en el formulario de horarios
const scheduleKeys = [
  'SLOT_DURATION',
  ...daysOfWeek.flatMap(day => [`${day.key}_OPENING_HOUR`, `${day.key}_CLOSING_HOUR`])
];

const SettingsPage = () => {
  // formData contendrá TODAS las configuraciones
  const [formData, setFormData] = useState({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Cargar configuraciones existentes
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const settings = await getSettings(); // getSettings devuelve el objeto { KEY: VALUE }
        
        // Cargar todas las configuraciones en el estado
        setFormData(settings);
        
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
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // --- CORRECCIÓN DE GUARDADO ---
    // Convertir el objeto formData COMPLETO al array que espera el backend
    // (El backend ahora espera: [{key: 'K1', value: 'V1'}, {key: 'K2', value: 'V2'}])
    const settingsToSave = Object.keys(formData).map(key => ({
      key: key,
      value: formData[key] || '' // Enviar string vacío si está indefinido
    }));
    // --- FIN DE CORRECCIÓN ---

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
  
  // --- LÓGICA PARA RESTAURAR CAMPOS ---
  // Filtramos las claves que NO están en el formulario de horarios
  const otherSettingsKeys = Object.keys(formData).filter(
    key => !scheduleKeys.includes(key) && key !== '__v' // Excluir claves internas de mongoose
  );
  // --- FIN LÓGICA ---

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold text-white mb-6">Configuración del Club</h1>

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-8">
        
        {/* --- Sección de Horarios (Visible siempre) --- */}
        <div className="border-b border-gray-700 pb-6">
          <h2 className="text-xl font-semibold text-cyan-400 mb-4">Horarios de Apertura</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* Duración del Turno */}
            <div className="md:col-span-1">
              <label htmlFor="SLOT_DURATION" className="block text-sm font-medium text-gray-300">
                Duración del Turno (en minutos)
              </label>
              <input
                type="number"
                name="SLOT_DURATION"
                id="SLOT_DURATION"
                value={formData.SLOT_DURATION || ''}
                onChange={handleChange}
                className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                placeholder="Ej: 60"
              />
            </div>
            
            <div className="md:col-span-1"></div> 

            {/* Formulario por día */}
            {daysOfWeek.map(day => (
              <React.Fragment key={day.key}>
                <div className="col-span-2 md:col-span-2 py-2">
                   <h3 className="text-lg font-medium text-gray-200">{day.label}</h3>
                </div>
                <div>
                  <label htmlFor={`${day.key}_OPENING_HOUR`} className="block text-sm font-medium text-gray-400">
                    Apertura
                  </label>
                  <input
                    type="time"
                    name={`${day.key}_OPENING_HOUR`}
                    id={`${day.key}_OPENING_HOUR`}
                    value={formData[`${day.key}_OPENING_HOUR`] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label htmlFor={`${day.key}_CLOSING_HOUR`} className="block text-sm font-medium text-gray-400">
                    Cierre
                  </label>
                  <input
                    type="time"
                    name={`${day.key}_CLOSING_HOUR`}
                    id={`${day.key}_CLOSING_HOUR`}
                    value={formData[`${day.key}_CLOSING_HOUR`] || ''}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                  />
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* --- Sección Avanzada (Restaurada) --- */}
        <div className="border-b border-gray-700 pb-6">
           <h2 className="text-xl font-semibold text-yellow-400 mb-4">Configuración Avanzada</h2>
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
              <p className="text-gray-400">No hay otras configuraciones avanzadas cargadas.</p>
            )}
           </div>
        </div>

        {/* --- Botón de Guardar --- */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white ${
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
