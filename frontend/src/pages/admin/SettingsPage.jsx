import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/settingService';
import { toast } from 'react-hot-toast';
import ScheduleGrid from '../../components/admin/ScheduleGrid'; // Importamos el nuevo componente

// Constantes para los días de la semana (buena práctica)
const DAYS_OF_WEEK = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const SettingsPage = () => {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para TODOS los campos. Usamos camelCase para el estado de React.
  // 1. Información del Club
  const [clubNombre, setClubNombre] = useState('');
  const [clubDireccion, setClubDireccion] = useState('');
  const [clubTelefono, setClubTelefono] = useState('');
  const [clubEmail, setClubEmail] = useState('');
  const [clubWhatsapp, setClubWhatsapp] = useState('');
  const [adminWhatsapp, setAdminWhatsapp] = useState('');

  // 2. Configuración de Reservas
  const [slotDuration, setSlotDuration] = useState('30');
  const [bookingLeadTime, setBookingLeadTime] = useState('15');
  const [bookingCancelCutoff, setBookingCancelCutoff] = useState('30');
  const [maxBookingsPerUser, setMaxBookingsPerUser] = useState('20');

  // 3. Configuración de Pagos y Moneda
  const [currency, setCurrency] = useState('ARS');
  const [enablePayments, setEnablePayments] = useState('true');
  
  // *** ELIMINADOS LOS ESTADOS DE MERCADO PAGO ***
  // const [mpPublicKey, setMpPublicKey] = useState('');
  // const [mpAccessToken, setMpAccessToken] = useState('');
  // const [mpWebhookSecret, setMpWebhookSecret] = useState('');

  // 4. Tienda
  const [shopEnabled, setShopEnabled] = useState('true');

  // 5. Horarios (los 21 campos que usará el ScheduleGrid)
  const [openingHours, setOpeningHours] = useState({
    MONDAY_IS_OPEN: "true", MONDAY_OPENING_HOUR: "08:00", MONDAY_CLOSING_HOUR: "23:00",
    TUESDAY_IS_OPEN: "true", TUESDAY_OPENING_HOUR: "08:00", TUESDAY_CLOSING_HOUR: "23:00",
    WEDNESDAY_IS_OPEN: "true", WEDNESDAY_OPENING_HOUR: "08:00", WEDNESDAY_CLOSING_HOUR: "23:00",
    THURSDAY_IS_OPEN: "true", THURSDAY_OPENING_HOUR: "08:00", THURSDAY_CLOSING_HOUR: "23:00",
    FRIDAY_IS_OPEN: "true", FRIDAY_OPENING_HOUR: "08:00", FRIDAY_CLOSING_HOUR: "23:00",
    SATURDAY_IS_OPEN: "true", SATURDAY_OPENING_HOUR: "08:00", SATURDAY_CLOSING_HOUR: "23:00",
    SUNDAY_IS_OPEN: "true", SUNDAY_OPENING_HOUR: "08:00", SUNDAY_CLOSING_HOUR: "23:00",
  });

  // --- Carga de Datos (Traducción API -> Estado) ---
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const { data } = await getSettings(); //
        if (data) {
          setSettings(data);
          // 1. Info Club
          setClubNombre(data.CLUB_NOMBRE || '');
          setClubDireccion(data.CLUB_DIRECCION || '');
          setClubTelefono(data.CLUB_TELEFONO || '');
          setClubEmail(data.CLUB_EMAIL || '');
          setClubWhatsapp(data.CLUB_WHATSAPP || '');
          setAdminWhatsapp(data.CLUB_ADMIN_WHATSAPP || '');
          
          // 2. Reservas
          setSlotDuration(data.SLOT_DURATION || '30');
          setBookingLeadTime(data.bookingLeadTime || '15');
          setBookingCancelCutoff(data.bookingCancelCutoff || '30');
          setMaxBookingsPerUser(data.maxBookingsPerUser || '20');

          // 3. Pagos
          setCurrency(data.CURRENCY || 'ARS');
          setEnablePayments(data.enablePayments || 'true');
          
          // *** ELIMINADA LA CARGA DE CLAVES MP ***

          // 4. Tienda
          setShopEnabled(data.SHOP_ENABLED || 'true');

          // 5. Horarios
          const loadedHours = {};
          DAYS_OF_WEEK.forEach(day => {
            loadedHours[`${day}_IS_OPEN`] = data[`${day}_IS_OPEN`] || "false";
            loadedHours[`${day}_OPENING_HOUR`] = data[`${day}_OPENING_HOUR`] || "00:00";
            loadedHours[`${day}_CLOSING_HOUR`] = data[`${day}_CLOSING_HOUR`] || "00:00";
          });
          setOpeningHours(loadedHours);
        }
      } catch (error) {
        toast.error('Error al cargar la configuración');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // --- Guardado de Datos (Traducción Estado -> API) ---
  const handleSaveSettings = async () => {
    // 1. Construir el objeto "Traductor" con los nombres de la API
    const apiSettingsData = {
      // Info Club
      CLUB_NOMBRE: clubNombre,
      CLUB_DIRECCION: clubDireccion,
      CLUB_TELEFONO: clubTelefono,
      CLUB_EMAIL: clubEmail,
      CLUB_WHATSAPP: clubWhatsapp,
      CLUB_ADMIN_WHATSAPP: adminWhatsapp,
      
      // Reservas
      SLOT_DURATION: slotDuration,
      bookingLeadTime: bookingLeadTime,
      bookingCancelCutoff: bookingCancelCutoff,
      maxBookingsPerUser: maxBookingsPerUser,

      // Pagos
      CURRENCY: currency,
      enablePayments: enablePayments,
      
      // *** ELIMINADAS LAS CLAVES MP DEL GUARDADO ***
      
      // Tienda
      SHOP_ENABLED: shopEnabled,

      // Horarios (vienen del estado 'openingHours', que fue actualizado por ScheduleGrid)
      ...openingHours
    };

    try {
      setIsLoading(true); // Deshabilita el botón mientras guarda
      const { data } = await updateSettings(apiSettingsData); //
      setSettings(data);
      toast.success('Configuración guardada exitosamente');
    } catch (error) {
      toast.error('Error al guardar: ' + (error.response?.data?.message || error.message));
      console.error(error);
    } finally {
      setIsLoading(false); // Vuelve a habilitar el botón
    }
  };

  // Esta función es llamada por el componente ScheduleGrid
  const handleScheduleChange = (newSchedule) => {
    setOpeningHours(prev => ({ ...prev, ...newSchedule }));
  };

  // No mostramos el formulario hasta que 'isLoading' sea false
  if (isLoading && Object.keys(settings).length === 0) {
    return <div className="p-6">Cargando configuración...</div>;
  }

  // --- Renderizado del Formulario ---
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Configuración del Club</h1>
      
      <div className="space-y-8">
        
        {/* Sección 1: Información del Club */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Información General</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Nombre del Club</span></label>
              <input type="text" value={clubNombre} onChange={(e) => setClubNombre(e.target.value)} className="input input-bordered w-full" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Dirección</span></label>
              <input type="text" value={clubDireccion} onChange={(e) => setClubDireccion(e.target.value)} className="input input-bordered w-full" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <input type="email" value={clubEmail} onChange={(e) => setClubEmail(e.target.value)} className="input input-bordered w-full" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Teléfono (Público)</span></label>
              <input type="text" value={clubTelefono} onChange={(e) => setClubTelefono(e.target.value)} className="input input-bordered w-full" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">WhatsApp (Reservas)</span></label>
              <input type="text" value={clubWhatsapp} onChange={(e) => setClubWhatsapp(e.target.value)} className="input input-bordered w-full" placeholder="Ej: 5493825123456" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">WhatsApp (Admin)</span></label>
              <input type="text" value={adminWhatsapp} onChange={(e) => setAdminWhatsapp(e.target.value)} className="input input-bordered w-full" placeholder="Ej: 5493825123456" disabled={isLoading} />
            </div>
          </div>
        </div>

        {/* Sección 2: Configuración de Horarios (NUEVO COMPONENTE) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Horarios de Apertura</h2>
          <p className="text-sm text-gray-500 mb-4">
            Haz clic y arrastra sobre la grilla para "pintar" los horarios de apertura.
            Tu problema de 8:00 a 02:00 se resuelve pintando de 8:00 a 23:30 un día, y de 00:00 a 02:00 el día siguiente.
          </p>
          <ScheduleGrid
            slotDuration={parseInt(slotDuration, 10)}
            openingHours={openingHours}
            onScheduleChange={handleScheduleChange}
          />
        </div>

        {/* Sección 3: Configuración de Reservas */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Reservas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Duración del Turno (min)</span></label>
              <select value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} className="select select-bordered w-full" disabled={isLoading}>
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Antelación mín. para reservar (min)</span></label>
              <input type="number" value={bookingLeadTime} onChange={(e) => setBookingLeadTime(e.target.value)} className="input input-bordered w-full" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Tiempo límite para cancelar (min)</span></label>
              <input type="number" value={bookingCancelCutoff} onChange={(e) => setBookingCancelCutoff(e.target.value)} className="input input-bordered w-full" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Máx. reservas activas por usuario</span></label>
              <input type="number" value={maxBookingsPerUser} onChange={(e) => setMaxBookingsPerUser(e.target.value)} className="input input-bordered w-full" disabled={isLoading} />
            </div>
          </div>
        </div>
        
        {/* Sección 4: Pagos y Tienda (MODIFICADA) */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">Pagos y Tienda</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label"><span className="label-text">Moneda</span></label>
              <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="input input-bordered w-full" placeholder="Ej: ARS" disabled={isLoading} />
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Habilitar Tienda</span></label>
              <select value={shopEnabled} onChange={(e) => setShopEnabled(e.target.value)} className="select select-bordered w-full" disabled={isLoading}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
            <div className="form-control">
              <label className="label"><span className="label-text">Habilitar Pagos (Mercado Pago)</span></label>
              <select value={enablePayments} onChange={(e) => setEnablePayments(e.target.value)} className="select select-bordered w-full" disabled={isLoading}>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            </div>
          </div>
          
          {/* --- SECCIÓN DE CLAVES MP ELIMINADA --- */}
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600">
              <strong>Nota:</strong> Las credenciales de Mercado Pago (Public Key, Access Token, Webhook Secret) se configuran de forma segura en las <strong>variables de entorno</strong> del servidor (Vercel / Render) y no desde esta pantalla.
            </p>
          </div>

        </div>

      </div>

      {/* Botón de Guardar Fijo (ESTÁ AQUÍ AL FINAL) */}
      <div className="mt-8">
        <button 
          onClick={handleSaveSettings} 
          className="btn btn-primary w-full md:w-auto"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar Configuración'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
