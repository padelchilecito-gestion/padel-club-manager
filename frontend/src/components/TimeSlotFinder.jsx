import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bookingService } from '../services/bookingService';
import { usePublicSettings } from '../contexts/PublicSettingsContext'; // Usamos el contexto
import { paymentService } from '../services/paymentService'; // Usamos el servicio de pago
import { format, addMinutes, parseISO, startOfToday, isToday, getDay, startOfDay } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const timeZone = 'America/Argentina/Buenos_Aires';

// --- Componente de Botón de Slot ---
const SlotButton = ({ isoSlot, label, onClick, isSelected, isDisabled }) => (
  <button
    onClick={() => onClick(isoSlot)}
    disabled={isDisabled}
    className={`p-3 w-full rounded-md text-center font-semibold transition-colors
      ${isSelected
        ? 'bg-primary text-white scale-105 shadow-lg'
        : 'bg-dark-primary hover:bg-primary-dark'}
      ${isDisabled
        ? 'opacity-30 bg-dark-primary cursor-not-allowed'
        : ''}
    `}
  >
    {label}
  </button>
);

// --- Componente de Opción de Cancha ---
const CourtOptionButton = ({ option, onClick, isSelected }) => (
  <button
    onClick={() => onClick(option)}
    className={`p-3 w-full rounded-md text-center font-semibold transition-colors
      ${isSelected
        ? 'bg-primary text-white scale-105 shadow-lg'
        : 'bg-dark-primary hover:bg-primary-dark'}
    `}
  >
    {option.name}
    <span className="block text-sm font-normal opacity-80">${option.price.toFixed(2)}</span>
  </button>
);


// --- Componente Principal (Reescrito) ---
const TimeSlotFinder = () => {
  // Estados de Carga y Errores
  const { isLoading: settingsLoading } = usePublicSettings();
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Estados de Datos
  const [allSlots, setAllSlots] = useState([]); // Slots de 30 min (de API 1)
  const [courtOptions, setCourtOptions] = useState([]); // Canchas/precios (de API 2)

  // Estados de Selección del Usuario
  const [selectedDate, setSelectedDate] = useState(format(startOfToday(), 'yyyy-MM-dd'));
  const [selectedSlots, setSelectedSlots] = useState([]); // Arreglo de ISO Strings
  const [selectedCourt, setSelectedCourt] = useState(null); // { id, name, price }
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // --- PASO 1: Cargar slots cuando cambia la fecha ---
  useEffect(() => {
    if (!selectedDate || settingsLoading) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setAllSlots([]);
      setBookingError('');
      // Reseteamos la selección
      setSelectedSlots([]);
      setCourtOptions([]);
      setSelectedCourt(null);

      try {
        const slotsISO = await bookingService.getPublicAvailabilitySlots(selectedDate);
        setAllSlots(slotsISO);
      } catch (err) {
        setBookingError('No se pudieron cargar los horarios. Intente más tarde.');
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [selectedDate, settingsLoading]);

  // --- Lógica de la Grilla (Hoy vs Mañana) ---
  const { todaySlots, nextDaySlots } = useMemo(() => {
    const selectedDayStart = startOfDay(parseISO(selectedDate));
    const today = [];
    const nextDay = [];

    allSlots.forEach(slotISO => {
      const slotDate = startOfDay(parseISO(slotISO));
      if (slotDate.getTime() === selectedDayStart.getTime()) {
        today.push(slotISO);
      } else {
        nextDay.push(slotISO);
      }
    });
    return { todaySlots: today, nextDaySlots: nextDay };
  }, [allSlots, selectedDate]);


  // --- PASO 2: Lógica de selección de slots (consecutivos) ---
  const handleSlotClick = (slotISO) => {
    const newSelection = [...selectedSlots];
    const index = newSelection.indexOf(slotISO);

    if (index > -1) {
      // Deseleccionar
      newSelection.splice(index, 1);
    } else {
      // Añadir
      newSelection.push(slotISO);
    }

    // Validar si son consecutivos
    if (newSelection.length > 1) {
      const sortedTimestamps = newSelection.map(s => parseISO(s).getTime()).sort((a, b) => a - b);
      let isConsecutive = true;
      for (let i = 0; i < sortedTimestamps.length - 1; i++) {
        const diff = sortedTimestamps[i+1] - sortedTimestamps[i];
        // Diferencia debe ser exactamente 30 minutos
        if (diff !== 30 * 60 * 1000) {
          isConsecutive = false;
          break;
        }
      }

      if (!isConsecutive) {
        // Si no son consecutivos, solo seleccionamos el último clic
        setSelectedSlots([slotISO]);
        setBookingError(''); // Limpiamos error anterior
        return;
      }
    }

    setSelectedSlots(newSelection);
    setBookingError('');
  };

  // --- PASO 3: Cargar Opciones de Cancha ---
  const selectedTimeRange = useMemo(() => {
    if (selectedSlots.length === 0) return null;

    const sortedTimestamps = selectedSlots.map(s => parseISO(s).getTime()).sort((a, b) => a - b);
    const start = new Date(sortedTimestamps[0]);
    const end = addMinutes(new Date(sortedTimestamps[sortedTimestamps.length - 1]), 30);
    
    return { start, end };
  }, [selectedSlots]);

  useEffect(() => {
    if (!selectedTimeRange) {
      setCourtOptions([]); // Limpiamos si no hay selección
      setSelectedCourt(null);
      return;
    }

    const fetchCourtOptions = async () => {
      setLoadingOptions(true);
      setCourtOptions([]);
      setSelectedCourt(null);
      setBookingError('');

      const { start, end } = selectedTimeRange;
      
      try {
        const options = await bookingService.getPublicCourtOptions(start.toISOString(), end.toISOString());
        if (options.length === 0) {
          setBookingError('No hay una misma cancha disponible para todo el rango seleccionado. Prueba un rango más corto.');
        }
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
        
        // Recargamos los slots para el día actual
        setLoadingSlots(true);
        const slotsISO = await bookingService.getPublicAvailabilitySlots(selectedDate);
        setAllSlots(slotsISO);
        setLoadingSlots(false);

        // Reseteamos el formulario
        setSelectedSlots([]);
        setSelectedCourt(null);
        setCourtOptions([]);
        setUserName('');
        setUserPhone('');
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

      {/* --- PASO 2: ELEGIR HORARIO --- */}
      <div className="mt-6">
        <h3 className="text-xl font-semibold text-text-primary mb-3">Paso 2: Elige los horarios (puedes elegir varios seguidos)</h3>
        
        {loadingSlots && <p className="text-text-secondary">Cargando turnos...</p>}
        {bookingError && !loadingOptions && <p className="text-danger text-center mb-4">{bookingError}</p>}
        
        {!loadingSlots && allSlots.length === 0 && (
          <p className="text-text-secondary">No hay turnos disponibles para este día.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Grilla "Hoy" */}
          {todaySlots.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-text-secondary mb-2 text-center">
                {format(parseISO(selectedDate), 'EEEE dd/MM')}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {todaySlots.map(slotISO => (
                  <SlotButton
                    key={slotISO}
                    isoSlot={slotISO}
                    label={formatSlotLabel(slotISO)}
                    onClick={handleSlotClick}
                    isSelected={selectedSlots.includes(slotISO)}
                    isDisabled={loadingOptions}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Grilla "Día Siguiente" (Madrugada) */}
          {nextDaySlots.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-text-secondary mb-2 text-center">
                Día Siguiente (Madrugada)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {nextDaySlots.map(slotISO => (
                  <SlotButton
                    key={slotISO}
                    isoSlot={slotISO}
                    label={formatSlotLabel(slotISO)}
                    onClick={handleSlotClick}
                    isSelected={selectedSlots.includes(slotISO)}
                    isDisabled={loadingOptions}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- PASO 3: ELEGIR CANCHA (SI HAY HORARIOS SELECCIONADOS) --- */}
      {selectedSlots.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary mb-3">Paso 3: Elige tu cancha</h3>
          {loadingOptions && <p className="text-text-secondary">Buscando canchas disponibles...</p>}
          
          {!loadingOptions && courtOptions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courtOptions.map(option => (
                <CourtOptionButton
                  key={option.id}
                  option={option}
                  onClick={setSelectedCourt}
                  isSelected={selectedCourt?.id === option.id}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- PASO 4: DATOS Y PAGO (SI HAY CANCHA SELECCIONADA) --- */}
      {selectedCourt && (
        <div className="mt-6 p-4 bg-dark-primary rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-primary">Resumen de tu Reserva</h3>
          <p className="text-text-primary mt-2">
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
            {bookingError && isBooking && <p className="text-danger text-sm text-center mb-2">{bookingError}</p>}
            <div className="space-y-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-text-secondary">Nombre Completo</label>
                <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.g.value)} required className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" />
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

export default TimeSlotFinder;
