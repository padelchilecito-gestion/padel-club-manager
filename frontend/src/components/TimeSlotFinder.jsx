import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bookingService } from '../services/bookingService';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import { paymentService } from '../services/paymentService';
import { format, addMinutes, parseISO, startOfToday } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const timeZone = 'America/Argentina/Buenos_Aires';

// --- Componente de Botón de Slot ---
// Reutilizable para horarios y canchas
const OptionButton = ({ label, subLabel, onClick, isSelected, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-3 w-full rounded-md text-center font-semibold transition-colors
      ${isSelected
        ? 'bg-primary text-white scale-105 shadow-lg'
        : 'bg-dark-primary hover:bg-primary-dark'}
      ${disabled
        ? 'opacity-50 bg-gray-700 cursor-not-allowed'
        : ''}
    `}
  >
    {label}
    {subLabel && <span className="block text-sm font-normal opacity-80">{subLabel}</span>}
  </button>
);

// --- Componente Principal (Reescrito) ---
const TimeSlotFinder = () => {
  // Estados de carga
  const { isLoading: settingsLoading } = usePublicSettings();
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Estados de datos
  const [availableSlots, setAvailableSlots] = useState([]); // Slots de 30 min (de API 1)
  const [courtOptions, setCourtOptions] = useState([]); // Canchas/precios (de API 2)

  // Estados de selección del usuario
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [selectedStartTime, setSelectedStartTime] = useState(null); // Slot de inicio (ISO String)
  const [selectedDuration, setSelectedDuration] = useState(60); // Duración en minutos (60, 90, 120)
  const [selectedCourt, setSelectedCourt] = useState(null); // { id, name, price }
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // --- PASO 1: Cargar slots cuando cambia la fecha ---
  useEffect(() => {
    if (!selectedDate || settingsLoading) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setAvailableSlots([]);
      // Reseteamos la selección
      setSelectedStartTime(null);
      setCourtOptions([]);
      setSelectedCourt(null);

      try {
        const slotsISO = await bookingService.getPublicAvailabilitySlots(selectedDate);
        setAvailableSlots(slotsISO);
      } catch (err) {
        setBookingError('No se pudieron cargar los horarios. Intente más tarde.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, settingsLoading]);

  // --- PASO 2: Calcular el Rango y Cargar Opciones de Cancha ---
  const selectedTimeRange = useMemo(() => {
    if (!selectedStartTime) return null;

    const start = parseISO(selectedStartTime);
    const end = addMinutes(start, selectedDuration);
    return { start, end };
  }, [selectedStartTime, selectedDuration]);

  useEffect(() => {
    if (!selectedTimeRange) return;

    const fetchCourtOptions = async () => {
      setLoadingOptions(true);
      setCourtOptions([]);
      setSelectedCourt(null);

      const { start, end } = selectedTimeRange;
      
      try {
        const options = await bookingService.getPublicCourtOptions(start.toISOString(), end.toISOString());
        setCourtOptions(options);
        // Si solo hay una opción, la seleccionamos automáticamente
        if (options.length === 1) {
          setSelectedCourt(options[0]);
        }
      } catch (err) {
        setBookingError('No se pudieron cargar las canchas para este horario.');
      } finally {
        setLoadingOptions(false);
      }
    };
    fetchCourtOptions();
  }, [selectedTimeRange]);
  
  // --- Lógica de selección de slot ---
  const handleSlotClick = (slotISO) => {
    setSelectedStartTime(prev => (prev === slotISO ? null : slotISO));
  };

  // --- PASO 4: Finalizar Reserva ---
  const handleFinalizeBooking = async (paymentMethod) => {
    if (!userName || !userPhone) {
      setBookingError('El nombre y el teléfono son obligatorios.');
      return;
    }
    if (!selectedCourt || !selectedTimeRange) {
      setBookingError('Por favor, selecciona una cancha y un horario válidos.');
      return;
    }

    setBookingError('');
    setIsBooking(true);

    const { start, end } = selectedTimeRange;
    
    const bookingData = {
      courtId: selectedCourt.id,
      user: { name: userName, phone: userPhone },
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      paymentMethod,
      isPaid: paymentMethod !== 'Efectivo',
      totalPrice: selectedCourt.price // Usamos el precio ya calculado
    };

    try {
      if (paymentMethod === 'Mercado Pago') {
        const paymentData = {
          items: [{
            title: `Reserva ${selectedCourt.name} - ${format(start, 'dd/MM HH:mm')}`,
            unit_price: selectedCourt.price,
            quantity: 1,
          }],
          payer: { name: userName, email: "test_user@test.com" },
          metadata: { booking_id: "PENDING", booking_data: bookingData }
        };
        
        const preference = await paymentService.createPaymentPreference(paymentData);
        window.location.href = preference.init_point;
      
      } else {
        const newBooking = await bookingService.createBooking(bookingData);
        alert(`¡Reserva confirmada! Tu turno para el ${format(start, 'dd/MM/yyyy HH:mm')} ha sido creado.`);
        
        // Resetear todo después de reservar en efectivo
        setLoadingSlots(true); // Forzar recarga de slots
        setSelectedDate(format(startOfToday(), 'yyyy-MM-dd'));
        setSelectedStartTime(null);
        setSelectedCourt(null);
        setCourtOptions([]);
        setUserName('');
        setUserPhone('');
        // Disparamos la recarga
        const slotsISO = await bookingService.getPublicAvailabilitySlots(selectedDate);
        setAvailableSlots(slotsISO);
        setLoadingSlots(false);
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Ocurrió un error al crear la reserva.');
    } finally {
      setIsBooking(false);
    }
  };

  // Función para formatear el botón de horario
  const formatSlotLabel = (isoString) => {
    const zonedTime = utcToZonedTime(parseISO(isoString), timeZone);
    return format(zonedTime, 'HH:mm');
  };

  return (
    <div className="bg-dark-secondary p-6 md:p-8 rounded-lg shadow-lg">
      
      {/* --- PASO 1: ELEGIR FECHA --- */}
      <h3 className="text-xl font-semibold text-text-primary mb-3">Paso 1: Elige el día</h3>
      <input
        type="date"
        id="date-select"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
        min={format(startOfToday(), 'yyyy-MM-dd')}
        className="w-full bg-dark-primary border border-gray-600 rounded-md p-2 text-text-primary focus:ring-primary focus:border-primary"
        disabled={settingsLoading || loadingSlots}
      />

      {/* --- PASO 2: ELEGIR HORARIO Y DURACIÓN --- */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-text-primary mb-3">Paso 2: Elige el horario de inicio y la duración</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <DurationOption value={60} label="60 min" selected={selectedDuration} onChange={setSelectedDuration} />
          <DurationOption value={90} label="90 min" selected={selectedDuration} onChange={setSelectedDuration} />
          <DurationOption value={120} label="120 min" selected={selectedDuration} onChange={setSelectedDuration} />
        </div>

        {loadingSlots && <p className="text-text-secondary">Cargando turnos...</p>}
        {!loadingSlots && availableSlots.length > 0 ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
            {availableSlots.map(slotISO => (
              <OptionButton
                key={slotISO}
                label={formatSlotLabel(slotISO)}
                onClick={() => handleSlotClick(slotISO)}
                isSelected={selectedStartTime === slotISO}
              />
            ))}
          </div>
        ) : (
          !loadingSlots && <p className="text-text-secondary">No hay turnos disponibles para este día.</p>
        )}
      </div>

      {/* --- PASO 3: ELEGIR CANCHA (SI HAY HORARIO) --- */}
      {selectedStartTime && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary mb-3">Paso 3: Elige tu cancha</h3>
          {loadingOptions && <p className="text-text-secondary">Buscando canchas disponibles...</p>}
          
          {!loadingOptions && courtOptions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courtOptions.map(option => (
                <OptionButton
                  key={option.id}
                  label={option.name}
                  subLabel={`$${option.price.toFixed(2)}`}
                  onClick={() => setSelectedCourt(option)}
                  isSelected={selectedCourt?.id === option.id}
                />
              ))}
            </div>
          )}

          {!loadingOptions && courtOptions.length === 0 && (
            <p className="text-text-secondary">
              No hay canchas disponibles que cubran el rango de {formatSlotLabel(selectedTimeRange.start)} a {formatSlotLabel(selectedTimeRange.end)} ({selectedDuration} min).
              Por favor, elige un horario de inicio más temprano o una duración menor.
            </p>
          )}
        </div>
      )}

      {/* --- PASO 4: DATOS Y PAGO (SI HAY CANCHA) --- */}
      {selectedCourt && (
        <div className="mt-6 p-4 bg-dark-primary rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-primary">Resumen de tu Reserva</h3>
          <p className="text-text-primary mt-2">
            Día: <span className="font-semibold">{format(parseISO(selectedDate), 'dd/MM/yyyy')}</span>
          </p>
          <p className="text-text-primary">
            Horario: <span className="font-semibold">{formatSlotLabel(selectedTimeRange.start)} a {formatSlotLabel(selectedTimeRange.end)}</span>
          </p>
          <p className="text-text-primary">
            Cancha: <span className="font-semibold">{selectedCourt.name}</span>
          </p>
          <p className="text-2xl font-bold text-secondary mt-2">
            Total: ${selectedCourt.price.toFixed(2)}
          </p>

          <div className="mt-4 pt-4 border-t border-gray-600">
            <h4 className="text-md font-semibold text-text-primary mb-3">Completa tus datos</h4>
            {bookingError && <p className="text-danger text-sm text-center mb-2">{bookingError}</p>}
            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-text-secondary">Nombre Completo</label>
                <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" />
              </div>
              <div>
                <label htmlFor="userPhone" className="block text-sm font-medium text-text-secondary">Teléfono (con código de área)</label>
                <input type="tel" id="userPhone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} required className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 mt-4">
              <button
                onClick={() => handleFinalizeBooking('Efectivo')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                disabled={isBooking}
              >
                {isBooking ? 'Procesando...' : 'Confirmar (Pago en club)'}
              </button>
              <button
                onClick={() => handleFinalizeBooking('Mercado Pago')}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                disabled={isBooking}
              >
                {isBooking ? 'Procesando...' : 'Pagar con Mercado Pago'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Componente helper para los botones de duración
const DurationOption = ({ value, label, selected, onChange }) => (
  <button
    onClick={() => onChange(value)}
    className={`p-2 rounded-md font-semibold ${
      selected === value 
      ? 'bg-primary text-white' 
      : 'bg-dark-primary hover:bg-primary-dark'
    }`}
  >
    {label}
  </button>
);

export default TimeSlotFinder;
