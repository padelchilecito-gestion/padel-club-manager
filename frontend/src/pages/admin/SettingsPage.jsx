import React, { useState, useEffect } from 'react';
import { settingService } from '../../services/settingService';
import { debugService } from '../../services/debugService';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    MERCADOPAGO_ACCESS_TOKEN: '',
    WHATSAPP_SENDER_NUMBER: '',
    WHATSAPP_API_TOKEN: '',
    TIMEZONE: 'America/Argentina/Buenos_Aires',
    WEEKDAY_OPENING_HOUR: '8',
    WEEKDAY_CLOSING_HOUR: '23',
    WEEKEND_OPENING_HOUR: '9',
    WEEKEND_CLOSING_HOUR: '22',
    SLOT_DURATION: '60',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await settingService.getSettings();
        setSettings(prev => ({ ...prev, ...data }));
      } catch (err) {
        setError('No se pudieron cargar las configuraciones.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await settingService.updateSettings(settings);
      setSuccess('¡Configuración guardada con éxito!');
    } catch (err) {
      setError('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDatabase = async () => {
    if (window.confirm('¿ESTÁS SEGURO? Esta acción es irreversible y borrará todas las reservas, ventas, productos, etc.')) {
      setResetting(true);
      try {
        const result = await debugService.resetDatabase();
        alert(result.message);
      } catch (err) {
        alert(err.message || 'Error al blanquear la base de datos.');
      } finally {
        setResetting(false);
      }
    }
  };

  if (loading) return <div className="text-center p-8">Cargando configuración...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Configuración del Sistema</h1>

      <div className="bg-dark-secondary p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            {/* Zona Horaria y Horarios */}
            <fieldset className="border border-gray-700 p-4 rounded-lg">
              <legend className="px-2 text-lg font-semibold text-primary">Operación del Club</legend>
              <div className="space-y-4 mt-2">
                <div>
                  <label htmlFor="TIMEZONE" className="block text-sm font-medium text-text-secondary">Zona Horaria</label>
                  <input type="text" name="TIMEZONE" value={settings.TIMEZONE} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="WEEKDAY_OPENING_HOUR" className="block text-sm font-medium text-text-secondary">Apertura (Lunes a Viernes)</label>
                    <input type="number" name="WEEKDAY_OPENING_HOUR" value={settings.WEEKDAY_OPENING_HOUR} onChange={handleChange} min="0" max="23" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="WEEKDAY_CLOSING_HOUR" className="block text-sm font-medium text-text-secondary">Cierre (Lunes a Viernes)</label>
                    <input type="number" name="WEEKDAY_CLOSING_HOUR" value={settings.WEEKDAY_CLOSING_HOUR} onChange={handleChange} min="0" max="23" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="WEEKEND_OPENING_HOUR" className="block text-sm font-medium text-text-secondary">Apertura (Fin de Semana)</label>
                    <input type="number" name="WEEKEND_OPENING_HOUR" value={settings.WEEKEND_OPENING_HOUR} onChange={handleChange} min="0" max="23" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                  </div>
                  <div>
                    <label htmlFor="WEEKEND_CLOSING_HOUR" className="block text-sm font-medium text-text-secondary">Cierre (Fin de Semana)</label>
                    <input type="number" name="WEEKEND_CLOSING_HOUR" value={settings.WEEKEND_CLOSING_HOUR} onChange={handleChange} min="0" max="23" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                  </div>
                </div>
                <div>
                  <label htmlFor="SLOT_DURATION" className="block text-sm font-medium text-text-secondary">Duración del Turno (en minutos)</label>
                  <input
                    type="number"
                    name="SLOT_DURATION"
                    id="SLOT_DURATION"
                    value={settings.SLOT_DURATION || ''}
                    onChange={handleChange}
                    className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
                    placeholder="Ej: 90"
                  />
                </div>
              </div>
            </fieldset>

            {/* Mercado Pago */}
            <fieldset className="border border-gray-700 p-4 rounded-lg">
              <legend className="px-2 text-lg font-semibold text-primary">Mercado Pago</legend>
               <div className="space-y-4 mt-2">
                <div>
                  <label htmlFor="MERCADOPAGO_ACCESS_TOKEN" className="block text-sm font-medium text-text-secondary">Access Token</label>
                  <input type="password" name="MERCADOPAGO_ACCESS_TOKEN" value={settings.MERCADOPAGO_ACCESS_TOKEN} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                </div>
              </div>
            </fieldset>

            {/* WhatsApp */}
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

        <fieldset className="border border-red-500 p-4 rounded-lg mt-6">
          <legend className="px-2 text-lg font-semibold text-danger">Zona de Peligro</legend>
          <div className="mt-2">
            <p className="text-sm text-text-secondary mb-4">
              Esta acción eliminará todos los datos de la aplicación (excepto los usuarios). Úsala con precaución.
            </p>
            <button
              type="button"
              onClick={handleResetDatabase}
              disabled={resetting}
              className="px-6 py-3 bg-danger hover:bg-red-700 text-white font-bold rounded-md transition-colors disabled:opacity-50"
            >
              {resetting ? 'Blanqueando...' : 'Blanquear Base de Datos'}
            </button>
          </div>
        </fieldset>
      </div>
    </div>
  );
};

export default SettingsPage;