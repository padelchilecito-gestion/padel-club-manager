import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/settingService';
import { FullPageLoading as Loading, ErrorMessage as Error, SuccessMessage as Success } from '../../components/ui/Feedback';
import { Settings, Save, Info, Clock, BookOpen, CreditCard, Mail } from 'lucide-react';

// Componente reutilizable para las tarjetas de configuración
const SettingsCard = ({ title, icon: Icon, children }) => (
  <div className="bg-gray-800 shadow-lg rounded-lg overflow-hidden">
    <div className="px-6 py-4 bg-gray-750">
      <h3 className="text-lg font-semibold text-white flex items-center">
        <Icon className="mr-3 text-indigo-400" size={22} />
        {title}
      </h3>
    </div>
    <div className="p-6 space-y-4">
      {children}
    </div>
  </div>
);

// Componente reutilizable para los campos de formulario
const InputField = ({ label, id, value, onChange, type = 'text', placeholder = '', helpText = '' }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      id={id}
      name={id}
      value={value || ''}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md shadow-sm text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    />
    {helpText && <p className="mt-1 text-xs text-gray-400">{helpText}</p>}
  </div>
);

// Componente reutilizable para los switches (checkboxes)
const SwitchField = ({ label, id, checked, onChange, helpText = '' }) => (
  <div className="flex items-center justify-between">
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      {helpText && <p className="mt-1 text-xs text-gray-400">{helpText}</p>}
    </div>
    <button
      type="button"
      id={id}
      onClick={() => onChange({ target: { name: id, value: !checked, type: 'checkbox' } })}
      className={`${
        checked ? 'bg-indigo-600' : 'bg-gray-600'
      } relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-900`}
    >
      <span
        className={`${
          checked ? 'translate-x-6' : 'translate-x-1'
        } inline-block w-4 h-4 transform bg-white rounded-full transition-transform`}
      />
    </button>
  </div>
);


const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getSettings();
        setSettings(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Error al cargar la configuración');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    
    // Convertir números si el tipo es 'number'
    const val = type === 'number' ? (value === '' ? '' : Number(value)) : value;

    setSettings((prev) => ({
      ...prev,
      [name]: val,
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      // Filtrar valores nulos o vacíos que no queremos enviar
      const settingsToUpdate = {};
      for (const key in settings) {
        if (settings[key] !== null && settings[key] !== undefined) {
          settingsToUpdate[key] = settings[key];
        }
      }
      
      await updateSettings(settingsToUpdate);
      setSuccessMessage('Configuración guardada exitosamente.');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la configuración');
    } finally {
      setIsLoading(false);
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  if (isLoading && !Object.keys(settings).length) {
    return <Loading text="Cargando configuración..." />;
  }

  return (
    <div className="container mx-auto p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Settings className="mr-3" size={30} />
          Configuración del Sistema
        </h1>
        <button
          onClick={handleSubmit}
          disabled={isLoading}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-gray-500"
        >
          <Save className="mr-2" size={20} />
          {isLoading ? 'Guardando...' : 'Guardar Cambios'}
        </button>
      </div>

      {error && <Error message={error} onClose={() => setError(null)} />}
      {successMessage && <Success message={successMessage} onClose={() => setSuccessMessage('')} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* --- CAMBIO REALIZADO AQUÍ ---
          Cambié 'md:grid-cols-2' por 'lg:grid-cols-2'.
          Esto hace que la grilla sea vertical (1 columna) en móviles Y tablets,
          y solo se divida en 2 columnas en pantallas grandes (lg: 1024px+).
        */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna Izquierda */}
          <div className="space-y-6">
            
            {/* Información del Club */}
            <SettingsCard title="Información del Club" icon={Info}>
              <InputField
                label="Nombre del Club"
                id="clubName"
                value={settings.clubName}
                onChange={handleChange}
                placeholder="Mi Padel Club"
              />
              <InputField
                label="Dirección"
                id="clubAddress"
                value={settings.clubAddress}
                onChange={handleChange}
                placeholder="Calle Falsa 123, Ciudad"
              />
              <InputField
                label="Teléfono de Contacto"
                id="clubPhone"
                value={settings.clubPhone}
                onChange={handleChange}
                placeholder="+54 9 380 000000"
              />
              <InputField
                label="Email de Contacto"
                id="clubEmail"
                type="email"
                value={settings.clubEmail}
                onChange={handleChange}
                placeholder="contacto@mipadel.com"
              />
            </SettingsCard>

            {/* Horarios de Funcionamiento */}
            <SettingsCard title="Horarios de Funcionamiento" icon={Clock}>
              <InputField
                label="Hora de Apertura"
                id="openTime"
                type="time"
                value={settings.openTime}
                onChange={handleChange}
              />
              <InputField
                label="Hora de Cierre"
                id="closeTime"
                type="time"
                value={settings.closeTime}
                onChange={handleChange}
              />
              <InputField
                label="Duración del Turno (minutos)"
                id="slotDuration"
                type="number"
                value={settings.slotDuration}
                onChange={handleChange}
                helpText="Ej: 60, 90. Afecta la grilla de turnos."
              />
            </SettingsCard>

          </div>

          {/* Columna Derecha */}
          <div className="space-y-6">

            {/* Reglas de Reserva */}
            <SettingsCard title="Reglas de Reserva" icon={BookOpen}>
              <InputField
                label="Antelación máxima para reservar (días)"
                id="bookingLeadTime"
                type="number"
                value={settings.bookingLeadTime}
                onChange={handleChange}
                helpText="Cuántos días a futuro pueden reservar los usuarios."
              />
              <InputField
                label="Límite para cancelar (minutos antes)"
                id="bookingCancelCutoff"
                type="number"
                value={settings.bookingCancelCutoff}
                onChange={handleChange}
                helpText="Ej: 120 (para 2 horas). 0 para no permitir."
              />
              <InputField
                label="Máx. reservas activas por usuario"
                id="maxBookingsPerUser"
                type="number"
                value={settings.maxBookingsPerUser}
                onChange={handleChange}
                helpText="Límite de reservas pendientes por usuario."
              />
            </SettingsCard>

            {/* Configuración de Pagos */}
            <SettingsCard title="Configuración de Pagos (Mercado Pago)" icon={CreditCard}>
              <SwitchField
                label="Habilitar Pagos Online"
                id="enablePayments"
                checked={!!settings.enablePayments}
                onChange={handleSwitchChange}
                helpText="Permitir que los usuarios paguen al reservar."
              />
              <InputField
                label="Mercado Pago - Public Key"
                id="mpPublicKey"
                value={settings.mpPublicKey}
                onChange={handleChange}
                placeholder="APP_USR-..."
              />
              <InputField
                label="Mercado Pago - Access Token"
                id="mpAccessToken"
                type="password"
                value={settings.mpAccessToken}
                onChange={handleChange}
                placeholder="APP_USR-..."
              />
              <InputField
                label="Mercado Pago - Webhook Secret"
                id="mpWebhookSecret"
                type="password"
                value={settings.mpWebhookSecret}
                onChange={handleChange}
                helpText="Opcional, para validación de Webhooks."
              />
            </SettingsCard>

            {/* Notificaciones */}
            <SettingsCard title="Notificaciones (Email)" icon={Mail}>
              <SwitchField
                label="Confirmación de Reserva"
                id="enableEmailBookingConfirmation"
                checked={!!settings.enableEmailBookingConfirmation}
                onChange={handleSwitchChange}
                helpText="Enviar email al crear una reserva."
              />
              <SwitchField
                label="Confirmación de Cancelación"
                id="enableEmailBookingCancellation"
                checked={!!settings.enableEmailBookingCancellation}
                onChange={handleSwitchChange}
                helpText="Enviar email al cancelar una reserva."
              />
              <SwitchField
                label="Confirmación de Pago Exitoso"
                id="enableEmailPaymentSuccess"
                checked={!!settings.enableEmailPaymentSuccess}
                onChange={handleSwitchChange}
                helpText="Enviar email al confirmar un pago."
              />
            </SettingsCard>
            
          </div>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
