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
    SHOP_ENABLED: 'false',
    // --- NUEVOS ESTADOS ---
    PUBLIC_TITLE: '',
    PUBLIC_SUBTITLE: '',
    PUBLIC_CONTACT_NUMBER: '',
    OWNER_NOTIFICATION_NUMBER: '',
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
        
        if (!otherSettings.SHOP_ENABLED) {
            otherSettings.SHOP_ENABLED = 'false';
        }
        
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

          {/* --- NUEVO FIELDSET PARA PERSONALIZACIÓN --- */}
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-primary">Personalización Pública</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="PUBLIC_TITLE" className="block text-sm font-medium text-text-secondary">Título Principal</label>
                <input type="text" name="PUBLIC_TITLE" value={settings.PUBLIC_TITLE || ''} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
              <div>
                <label htmlFor="PUBLIC_SUBTITLE" className="block text-sm font-medium text-text-secondary">Subtítulo</label>
                <input type="text" name="PUBLIC_SUBTITLE" value={settings.PUBLIC_SUBTITLE || ''} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
            </div>
          </fieldset>

          {/* Fieldset de Tienda (sin cambios) */}
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-primary">Tienda Pública</legend>
            <div className="flex items-center gap-4 mt-2">
                <input 
                    type="checkbox" 
                    name="SHOP_ENABLED" 
                    id="shop_enabled_checkbox"
                    checked={settings.SHOP_ENABLED === 'true'} 
                    onChange={handleChange} 
                    className="h-5 w-5 rounded border-gray-600 bg-dark-primary text-primary focus:ring-primary" 
                />
                <label htmlFor="shop_enabled_checkbox" className="text-sm text-text-secondary">
                    Activar la página de la Tienda (/shop)
                </label>
            </div>
          </fieldset>
          
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

          {/* --- FIELDSET DE WHATSAPP MODIFICADO --- */}
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-secondary">WhatsApp (Sin API)</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="PUBLIC_CONTACT_NUMBER" className="block text-sm font-medium text-text-secondary">N° de Contacto Público (para clientes)</label>
                <input type="text" name="PUBLIC_CONTACT_NUMBER" value={settings.PUBLIC_CONTACT_NUMBER || ''} onChange={handleChange} placeholder="Ej: 5493825123456" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                <p className="text-xs text-gray-400 mt-1">Incluir código de país sin el "+". Se usará para el botón "Contacto" de la web.</p>
              </div>
               <div>
                <label htmlFor="OWNER_NOTIFICATION_NUMBER" className="block text-sm font-medium text-text-secondary">N° de Notificación del Dueño (para avisos)</label>
                <input type="text" name="OWNER_NOTIFICATION_NUMBER" value={settings.OWNER_NOTIFICATION_NUMBER || ''} onChange={handleChange} placeholder="Ej: 5493825654321" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                <p className="text-xs text-gray-400 mt-1">El número que recibirá el aviso de WhatsApp cuando se confirme una reserva.</p>
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
