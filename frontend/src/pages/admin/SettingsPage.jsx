import React, { useState, useEffect } from 'react';
import settingService from '../../services/settingService';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await settingService.getSettings();
      // Transforma el array de settings en un objeto para fácil acceso
      const settingsObject = data.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {});
      setSettings(settingsObject);
    } catch (err) {
      setError('No se pudieron cargar las configuraciones.');
      toast.error('No se pudieron cargar las configuraciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Transforma el objeto de settings de nuevo a un array para la API
      const settingsArray = Object.keys(settings).map(key => ({
        key,
        value: settings[key],
      }));
      
      await settingService.updateSettings(settingsArray);
      toast.success('Configuraciones guardadas con éxito');
    } catch (err) {
      toast.error('Error al guardar las configuraciones.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !settings) {
    return <div className="p-8 text-center">Cargando configuraciones...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-error">{error}</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">
        Configuración del Club
      </h1>

      <form onSubmit={handleSaveSettings} className="max-w-2xl space-y-8">
        {/* Sección de Horarios */}
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-primary mb-4">Horarios de Apertura</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Hora de Apertura (HH:mm)</span>
              </label>
              <input
                type="time"
                name="clubOpeningTime"
                value={settings?.clubOpeningTime || '09:00'}
                onChange={handleInputChange}
                className="input input-bordered w-full"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Hora de Cierre (HH:mm)</span>
              </label>
              <input
                type="time"
                name="clubClosingTime"
                value={settings?.clubClosingTime || '23:00'}
                onChange={handleInputChange}
                className="input input-bordered w-full"
              />
            </div>
          </div>
        </div>

        {/* Sección de Reservas */}
        <div className="bg-base-200 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold text-primary mb-4">Configuración de Reservas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Duración del Turno (minutos)</span>
              </label>
              <input
                type="number"
                name="bookingSlotDuration"
                value={settings?.bookingSlotDuration || 60}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                min="30"
                step="15"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Días de antelación para reservar</span>
              </label>
              <input
                type="number"
                name="bookingMaxDaysInAdvance"
                value={settings?.bookingMaxDaysInAdvance || 7}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                min="1"
              />
            </div>
          </div>
          <div className="form-control mt-4">
            <label className="label cursor-pointer">
              <span className="label-text">¿Requerir pago para confirmar reserva?</span>
              <input
                type="checkbox"
                name="requirePaymentForBooking"
                checked={settings?.requirePaymentForBooking || false}
                onChange={handleInputChange}
                className="toggle toggle-primary"
              />
            </label>
          </div>
        </div>

        {/* Botón de Guardar */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner"></span> : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
