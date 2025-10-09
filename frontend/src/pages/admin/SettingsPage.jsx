import React, { useState, useEffect } from 'react';
import { settingService } from '../../services/settingService';

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    MERCADOPAGO_ACCESS_TOKEN: '',
    WHATSAPP_SENDER_NUMBER: '',
    WHATSAPP_API_TOKEN: '',
    WEEKDAY_OPENING_HOUR: '08:00',
    WEEKDAY_CLOSING_HOUR: '23:00',
    WEEKEND_OPENING_HOUR: '09:00',
    WEEKEND_CLOSING_HOUR: '22:00',
    CANCELLATION_POLICY_HOURS: '24',
    CANCELLATION_PENALTY_PERCENTAGE: '0',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  if (loading) return <div className="text-center p-8">Cargando configuración...</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Configuración del Sistema</h1>

      <form onSubmit={handleSubmit} className="bg-dark-secondary p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
        <div className="space-y-6">
          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-primary">Mercado Pago</legend>
            <div className="space-y-4 mt-2">
              <div>
                <label htmlFor="MERCADOPAGO_ACCESS_TOKEN" className="block text-sm font-medium text-text-secondary">Access Token</label>
                <input type="password" name="MERCADOPAGO_ACCESS_TOKEN" value={settings.MERCADOPAGO_ACCESS_TOKEN} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-green-400">Horarios de Apertura</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="WEEKDAY_OPENING_HOUR" className="block text-sm font-medium text-text-secondary">Apertura (Lunes a Viernes)</label>
                <input type="time" name="WEEKDAY_OPENING_HOUR" value={settings.WEEKDAY_OPENING_HOUR} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
              <div>
                <label htmlFor="WEEKDAY_CLOSING_HOUR" className="block text-sm font-medium text-text-secondary">Cierre (Lunes a Viernes)</label>
                <input type="time" name="WEEKDAY_CLOSING_HOUR" value={settings.WEEKDAY_CLOSING_HOUR} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
              <div>
                <label htmlFor="WEEKEND_OPENING_HOUR" className="block text-sm font-medium text-text-secondary">Apertura (Fin de Semana)</label>
                <input type="time" name="WEEKEND_OPENING_HOUR" value={settings.WEEKEND_OPENING_HOUR} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
              <div>
                <label htmlFor="WEEKEND_CLOSING_HOUR" className="block text-sm font-medium text-text-secondary">Cierre (Fin de Semana)</label>
                <input type="time" name="WEEKEND_CLOSING_HOUR" value={settings.WEEKEND_CLOSING_HOUR} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-gray-700 p-4 rounded-lg">
            <legend className="px-2 text-lg font-semibold text-green-400">Políticas de Cancelación</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div>
                <label htmlFor="CANCELLATION_POLICY_HOURS" className="block text-sm font-medium text-text-secondary">Horas para cancelar sin cargo</label>
                <input type="number" name="CANCELLATION_POLICY_HOURS" value={settings.CANCELLATION_POLICY_HOURS} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                <p className="text-xs text-gray-400 mt-1">Número de horas antes del turno para cancelar sin penalización.</p>
              </div>
              <div>
                <label htmlFor="CANCELLATION_PENALTY_PERCENTAGE" className="block text-sm font-medium text-text-secondary">Porcentaje de penalización (%)</label>
                <input type="number" name="CANCELLATION_PENALTY_PERCENTAGE" value={settings.CANCELLATION_PENALTY_PERCENTAGE} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
                <p className="text-xs text-gray-400 mt-1">Porcentaje del total de la reserva a penalizar si se cancela fuera de plazo.</p>
              </div>
            </div>
          </fieldset>

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