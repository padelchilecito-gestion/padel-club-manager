import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { bookingService } from '../services/bookingService';
import { usePublicSettings } from '../contexts/PublicSettingsContext';
import { paymentService } from '../services/paymentService';
import { 
  format, 
  addMinutes, 
  parseISO, 
  startOfToday, 
  isSameDay, 
  startOfDay,
  addDays,
  subDays
} from 'date-fns';
import { es } from 'date-fns/locale'; 
import { utcToZonedTime } from 'date-fns-tz';
import { ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

const timeZone = 'America/Argentina/Buenos_Aires';

// (Componentes SlotButton y CourtOptionButton no cambian)
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


const TimeSlotFinder = () => {
  const { settings, isLoading: settingsLoading } = usePublicSettings();
  const ownerNumber = (settings.ownerNotificationNumber || '').replace(/[^0-9]/g, '');

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [allSlots, setAllSlots] = useState([]); 
  const [courtOptions, setCourtOptions] = useState([]); 
  const [selectedDate, setSelectedDate] = useState(startOfToday()); 
  const [selectedSlots, setSelectedSlots] = useState([]); 
  const [selectedCourt, setSelectedCourt] = useState(null); 
  
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userEmail, setUserEmail] = useState(''); 
  
  const [cashBookingSuccess, setCashBookingSuccess] = useState(null);

  // --- PASO 1: Cargar slots (FUNCIÓN MODIFICADA) ---
  const fetchSlots = useCallback(async () => {
    if (settingsLoading) return;
    setLoadingSlots(true);
    // setAllSlots([]); // No es necesario si lo hacemos abajo
    setBookingError('');
    setSelectedSlots([]);
    setCourtOptions([]);
    setSelectedCourt(null);
    
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const slotsISO = await bookingService.getPublicAvailabilitySlots(dateString);
      
      // --- ¡AQUÍ ESTÁ LA CORRECCIÓN! ---
      // Si slotsISO es `null` o `undefined`, usamos un array vacío `[]`.
      setAllSlots(slotsISO || []);
      // ---------------------------------
      
    } catch (err) {
      setBookingError('No se pudieron cargar los horarios. Intente más tarde.');
      setAllSlots([]); // Aseguramos que sea un array en caso de error
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, settingsLoading]); // fetchSlots depende de selectedDate

  // --- EFECTO DE CARGA (MODIFICADO) ---
  useEffect(() => {
    setCashBookingSuccess(null); 
    fetchSlots();
  }, [fetchSlots]); // fetchSlots depende de selectedDate

  // (Lógica de la Grilla (Hoy vs Mañana) no cambia)
  const { todaySlots, nextDaySlots } = useMemo(() => {
    const selectedDayStart = startOfDay(selectedDate);
    const today = [];
    const nextDay = [];
    
    // Esta línea ahora es segura gracias a la corrección de arriba
    allSlots.forEach(slotISO => {
      const slotDate = startOfDay(parseISO(slotISO));
      if (isSameDay(slotDate, selectedDayStart)) {
        today.push(slotISO);
      } else {
        nextDay.push(slotISO);
      }
    });
    return { todaySlots: today, nextDaySlots: nextDay };
  }, [allSlots, selectedDate]);


  // --- PASO 2: Lógica de selección de slots (MODIFICADA) ---
  const handleSlotClick = (slotISO) => {
    setCashBookingSuccess(null); 
    const newSelection = [...selectedSlots];
    const index = newSelection.indexOf(slotISO);

    if (index > -1) {
      newSelection.splice(index, 1);
    } else {
      newSelection.push(slotISO);
    }

    // (Validación de slots consecutivos no cambia)
    if (newSelection.length > 1) {
      const sortedTimestamps = newSelection.map(s => parseISO(s).getTime()).sort((a, b) => a - b);
      let isConsecutive = true;
      for (let i = 0; i < sortedTimestamps.length - 1; i++) {
        const diff = sortedTimestamps[i+1] - sortedTimestamps[i];
        if (diff !== 30 * 60 * 1000) {
          isConsecutive = false;
          break;
        }
      }
      if (!isConsecutive) {
        setSelectedSlots([slotISO]);
        setBookingError('');
        return;
      }
    }
    setSelectedSlots(newSelection);
    setBookingError('');
  };

  // (selectedTimeRange y useEffect de Opciones de Cancha no cambian)
  const selectedTimeRange = useMemo(() => {
    if (selectedSlots.length === 0) return null;
    const sortedTimestamps = selectedSlots.map(s => parseISO(s).getTime()).sort((a, b) => a - b);
    const start = new Date(sortedTimestamps[0]);
    const end = addMinutes(new Date(sortedTimestamps[sortedTimestamps.length - 1]), 30);
    return { start, end };
  }, [selectedSlots]);

  useEffect(() => {
    if (!selectedTimeRange) {
      setCourtOptions([]); 
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
        if (options.length === 1) {
          setSelectedCourt(options[0]);
        }
      } catch (err) {
        setBookingError('No se pudieron cargar las canchas para este horario.');
      } finally {
        setLoadingOptions(false);
      }
    };
    const timer = setTimeout(fetchCourtOptions, 300);
    return () => clearTimeout(timer);
  }, [selectedTimeRange]);
  
  // --- PASO 4: Finalizar Reserva (MODIFICADO) ---
  const handleFinalizeBooking = async (paymentMethod) => {
    // (Validaciones no cambian)
    if (!userName || !userPhone || !userEmail) {
      setBookingError('El nombre, teléfono y email son obligatorios.');
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
      user: { name: userName, phone: userPhone, email: userEmail },
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      paymentMethod,
      isPaid: paymentMethod !== 'Efectivo',
      totalPrice: selectedCourt.price
    };

    try {
      if (paymentMethod === 'Mercado Pago') {
        // (Lógica de MP no cambia)
        const paymentData = {
          items: [{
            title: `Reserva ${selectedCourt.name} - ${format(start, 'dd/MM HH:mm')}`,
            unit_price: selectedCourt.price,
            quantity: 1,
          }],
          payer: { name: userName, email: userEmail },
          metadata: { booking_id: "PENDING", booking_data: bookingData }
        };
        const preference = await paymentService.createPaymentPreference(paymentData);
        window.location.href = preference.init_point;
      
      } else {
        // --- LÓGICA DE PAGO EN EFECTIVO MODIFICADA ---
        await bookingService.createBooking(bookingData);
        
        const fechaStr = formatSlotLabel(start);
        const diaStr = formatDateHeader(start, true);
        const msg = `¡Nueva reserva (pago en club)!\nCliente: ${userName}\nCancha: ${selectedCourt.name}\nDía: ${diaStr}\nHora: ${fechaStr}`;
        const whatsappLink = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;

        // Mostramos el mensaje de éxito
        setCashBookingSuccess({
            message: `¡Reserva confirmada para ${diaStr} a las ${fechaStr}!`,
            whatsappLink: whatsappLink
        });
        
        // Recargamos los slots
        fetchSlots(); // <-- Esta llamada ya NO borra el cartel
        
        // Reseteamos el formulario
        setSelectedSlots([]);
        setSelectedCourt(null);
        setCourtOptions([]);
        setUserName('');
        setUserPhone('');
        setUserEmail('');
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || 'Ocurrió un error al crear la reserva.');
    } finally {
      setIsBooking(false);
    }
  };

  // (Funciones de navegación y formato de fecha no cambian)
  const today = startOfToday();
  const isViewingToday = isSameDay(selectedDate, today);

  const handlePrevDay = () => {
    if (isViewingToday) return; 
    setSelectedDate(subDays(selectedDate, 1));
  };
  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };
  const formatSlotLabel = (dateOrIsoString) => {
    const zonedTime = utcToZonedTime(dateOrIsoString, timeZone);
    return format(zonedTime, 'HH:mm');
  };
  const formatDateHeader = (date, includeDayName = true) => {
    const formatString = includeDayName ? 'EEEE dd/MM' : 'dd/MM';
    let formatted = format(date, formatString, { locale: es });
    if (includeDayName) {
        formatted = formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }
    return formatted;
  };

  // --- RENDERIZADO (sin cambios, pero ahora funcionará) ---
  return (
    <div className="bg-dark-secondary p-6 md:p-8 rounded-lg shadow-lg">
      
      {/* NAVEGADOR DE FECHA */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={handlePrevDay} disabled={isViewingToday || loadingSlots} className="p-3 bg-dark-primary rounded-full disabled:opacity-30 hover:bg-primary-dark transition-colors">
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <h2 className="text-2xl font-bold text-text-primary text-center">
          {formatDateHeader(selectedDate)}
        </h2>
        <button onClick={handleNextDay} disabled={loadingSlots} className="p-3 bg-dark-primary rounded-full hover:bg-primary-dark transition-colors">
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>
      
      {/* GRILLAS DE HORARIOS */}
      <div>
        <h3 className="text-xl font-semibold text-text-primary mb-4">Selecciona los horarios (puedes elegir varios seguidos)</h3>
        
        {loadingSlots && <p className="text-text-secondary text-center">Cargando turnos...</p>}
        {bookingError && !loadingOptions && <p className="text-danger text-center mb-4">{bookingError}</p>}
        {!loadingSlots && allSlots.length === 0 && (
          <p className="text-text-secondary text-center">No hay turnos disponibles para este día.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {todaySlots.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-text-secondary mb-3 text-center md:text-left">
                {formatDateHeader(selectedDate)}
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {todaySlots.map(slotISO => (
                  <SlotButton key={slotISO} isoSlot={slotISO} label={formatSlotLabel(slotISO)} onClick={handleSlotClick} isSelected={selectedSlots.includes(slotISO)} isDisabled={loadingOptions} />
                ))}
              </div>
            </div>
          )}
          {nextDaySlots.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-text-secondary mb-3 text-center md:text-left">
                {formatDateHeader(addDays(selectedDate, 1))} (Madrugada)
              </h4>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {nextDaySlots.map(slotISO => (
                  <SlotButton key={slotISO} isoSlot={slotISO} label={formatSlotLabel(slotISO)} onClick={handleSlotClick} isSelected={selectedSlots.includes(slotISO)} isDisabled={loadingOptions} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- MENSAJE DE ÉXITO (PARA PAGO EN EFECTIVO) --- */}
      {cashBookingSuccess && (
        <div className="mt-6 p-4 bg-green-800 border border-secondary rounded-lg text-center">
            <CheckCircleIcon className="h-12 w-12 text-secondary mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-2">{cashBookingSuccess.message}</h3>
            <p className="text-gray-300 mb-4">Por favor, notifica al club para confirmar tu llegada.</p>
            <a
                href={cashBookingSuccess.whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2 bg-secondary text-dark-primary font-bold rounded-md transition-colors hover:bg-green-400"
            >
                Notificar por WhatsApp
            </a>
        </div>
      )}

      {/* --- ELEGIR CANCHA (Oculto si hay éxito) --- */}
      {selectedSlots.length > 0 && !cashBookingSuccess && (
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h3 className="text-xl font-semibold text-text-primary mb-3">Elige tu cancha</h3>
          {loadingOptions && <p className="text-text-secondary">Buscando canchas disponibles...</p>}
          {!loadingOptions && courtOptions.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {courtOptions.map(option => (
                <CourtOptionButton key={option.id} option={option} onClick={setSelectedCourt} isSelected={selectedCourt?.id === option.id} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- DATOS Y PAGO (Oculto si hay éxito) --- */}
      {selectedCourt && !cashBookingSuccess && (
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
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-text-secondary">Email</label>
                <input type="email" id="userEmail" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required placeholder="Para recibir tu comprobante" className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" />
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
