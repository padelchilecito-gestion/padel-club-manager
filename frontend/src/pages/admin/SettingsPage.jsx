import React, { useState, useEffect, useCallback } from 'react';
import { settingService } from '../../services/settingService';
import ScheduleEditor from '../../components/admin/ScheduleEditor'; 

// Crea un horario por defecto (todo cerrado)
const createDefaultSchedule = () => {
  const defaultSchedule = {};
  for (let i = 0; i < 7; i++) {
    defaultSchedule[i] = Array(48).fill(false);
  }
  return defaultSchedule;
};

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    MERCADOPAGO_ACCESS_TOKEN: '',
    WHATSAPP_SENDER_NUMBER: '',
    WHATSAPP_API_TOKEN: '',
    // --- NUEVO ESTADO ---
    SHOP_ENABLED: 'false', // Guardamos como string 'true'/'false'
  });
  
  const [businessHours, setBusinessHours] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingService.getSettings();
        
        const { BUSINESS_HOURS, ...otherSettings } = data;
        
        // --- Aseguramos que SHOP_ENABLED tenga un valor ---
        if (!otherSettings.SHOP_ENABLED) {
            otherSettings.SHOP_ENABLED = 'false';
        }
        // --------------------------------------------------
        
        setSettings(prev => ({ ...prev, ...otherSettings }));

        if (BUSINESS_HOURS) {
          setBusinessHours(JSON.parse(BUSINESS_HOURS));
        } else {
          setBusinessHours(createDefaultSchedule());
        }

      } catch (err) {
        setError('No se pudieron cargar las configuraciones.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // --- LÓGICA PARA EL CHECKBOX ---
    if (type === 'checkbox') {
        setSettings(prev => ({
            ...prev,
            [name]: checked.toString() // Convertimos boolean a string 'true'/'false'
        }));
    } else {
        setSettings(prev => ({
            ...prev,
            [name]: value,
        }));
    }
    // ---------------------------------
  };

  const handleScheduleChange = useCallback((newSchedule) => {
    setBusinessHours(newSchedule);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    
    const settingsToSave = {
      ...settings,
      BUSINESS_HOURS: JSON.stringify(businessHours),
    };
    
    try {
      await settingService.updateSettings(settingsToSave);
      setSuccess('¡Configuración guardada con éxito!');
    } catch (err) {
      setError('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !businessHours) return <div className="text-center p-8">Cargando configuración...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Configuración del Sistema</h1>

      <form onSubmit={handleSubmit} className="bg-dark-secondary p-4 md:p-8 rounded-lg shadow-lg">
        
        {/* Editor de Horarios (sin cambios) */}
        <fieldset className="border border-gray-700 p-4 rounded-lg mb-6">
          <legend className="px-2 text-lg font-semibold text-primary">Horarios de Apertura</legend>
          <ScheduleEditor 
            schedule={businessHours} 
            onChange={handleScheduleChange} 
          />
        </fieldset>
        
        <div className="space-y-6">

          {/* --- NUEVO FIELDSET PARA LA TIENDA --- */}
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-primary">Tienda Pública</legend>
            <div className="flex items-center gap-4 mt-2">
                <input 
                    type="checkbox" 
                    name="SHOP_ENABLED" 
                    id="shop_enabled_checkbox"
                    // Convertimos string 'true' a boolean
                    checked={settings.SHOP_ENABLED === 'true'} 
                    onChange={handleChange} 
                    className="h-5 w-5 rounded border-gray-600 bg-dark-primary text-primary focus:ring-primary" 
                />
                <label htmlFor="shop_enabled_checkbox" className="text-sm text-text-secondary">
                    Activar la página de la Tienda (/shop)
                </label>
            </div>
          </fieldset>
          {/* -------------------------------------- */}

          {/* Mercado Pago (sin cambios) */}
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-primary">Mercado Pago</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="MERCADOPAGO_ACCESS_TOKEN" className="block text-sm font-medium text-text-secondary">Access Token</label>
                <input type="password" name="MERCADOPAGO_ACCESS_TOKEN" value={settings.MERCADOPAGO_ACCESS_TOKEN} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
            </div>
          </fieldset>

          {/* WhatsApp (sin cambios) */}
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-secondary">WhatsApp</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="WHATSAPP_SENDER_NUMBER" className="block text-sm font-medium text-text-secondary">Número de Envío (con código de país)</label>
                <input type="text" name="WHATSAPP_SENDER_NUMBER" value={settings.WHATSAPP_SENDER_NUMBER} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
               <div>
                <label htmlFor="WHATSAPP_API_TOKEN" className="block text-sm font-medium text-text-secondary">Token de la API</label>
                <input type="password" name="WHATSAPP_API_TOKEN" value={settings.WHATSAPP_API_TOKEN || ''} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
            </div>
          </fieldset>
        </div>

        {error && <p className="text-danger text-center text-sm mt-4">{error}</p>}
        {success && <p className="text-green-500 text-center text-sm mt-4">{success}</p>}

        <div className="mt-8 text-right">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
