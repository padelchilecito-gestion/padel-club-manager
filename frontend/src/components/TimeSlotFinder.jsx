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

// (No necesitamos el modal de pago interno ni initMercadoPago aquí)

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

  // --- Lógica para PWA (Instalar App) ---
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setShowInstallButton(false);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
    }
  };
  // --- Fin Lógica PWA ---

  const fetchSlots = useCallback(async () => {
    if (settingsLoading) return;
    setLoadingSlots(true);
    setAllSlots([]);
    setBookingError('');
    setSelectedSlots([]);
    setCourtOptions([]);
    setSelectedCourt(null);
    
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const slotsISO = await bookingService.getPublicAvailabilitySlots(dateString);
      setAllSlots(slotsISO);
    } catch (err) {
      setBookingError('No se pudieron cargar los horarios. Intente más tarde.');
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedDate, settingsLoading]);

  useEffect(() => {
    setCashBookingSuccess(null); 
    fetchSlots();
  }, [fetchSlots]); 

  const { todaySlots, nextDaySlots } = useMemo(() => {
    const selectedDayStart = startOfDay(selectedDate);
    const today = [];
    const nextDay = [];
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


  const handleSlotClick = (slotISO) => {
    setCashBookingSuccess(null); 
    const newSelection = [...selectedSlots];
    const index = newSelection.indexOf(slotISO);

    if (index > -1) {
      newSelection.splice(index, 1);
    } else {
      newSelection.push(slotISO);
    }

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
  
  
  // --- FUNCIÓN handleFinalizeBooking MODIFICADA (SOLUCIONA BUG 1) ---
  const handleFinalizeBooking = async (paymentMethod) => {
    // 1. Validar solo nombre y teléfono
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
    
    // El objeto bookingData ahora envía el email o un string vacío.
    const bookingData = {
      courtId: selectedCourt.id,
      user: { name: userName, phone: userPhone, email: userEmail || '' },
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      paymentMethod,
      isPaid: paymentMethod !== 'Efectivo',
      totalPrice: selectedCourt.price
    };

    try {
      if (paymentMethod === 'Mercado Pago') {
        
        const paymentData = {
          items: [{
            title: `Reserva ${selectedCourt.name} - ${format(start, 'dd/MM HH:mm')}`,
            unit_price: selectedCourt.price,
            quantity: 1,
          }],
          payer: { name: userName, email: userEmail || "test_user@test.com" }, 
          // Adjuntamos los datos para la URL de éxito (Bug 3)
          metadata: { 
            booking_id: "PENDING", 
            booking_data: {
                ...bookingData, // bookingData ya tiene todo (user, courtId, price, etc)
                startTime: start.toISOString(), // Aseguramos formato ISO
                endTime: end.toISOString()
            }
          }
        };

        const preference = await paymentService.createPaymentPreference(paymentData);
        
        // Redirigimos al checkout de MP
        window.location.href = preference.init_point; 
      
      } else {
        
        // --- ¡ESTE ES EL CAMBIO PARA BUG 1! ---
        // Usamos el nuevo servicio público en lugar de 'createBooking'
        await bookingService.createPublicBooking(bookingData);
        // --- FIN DEL CAMBIO ---
        
        const fechaStr = formatSlotLabel(start);
        const diaStr = formatDateHeader(start, true);
        const msg = `¡Nueva reserva (pago en club)!\nCliente: ${userName}\nCancha: ${selectedCourt.name}\nDía: ${diaStr}\nHora: ${fechaStr}`;
        const whatsappLink = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;

        setCashBookingSuccess({
            message: `¡Reserva confirmada para ${diaStr} a las ${fechaStr}!`,
            whatsappLink: whatsappLink
        });
        
        fetchSlots(); 
        
        setSelectedSlots([]);
        setSelectedCourt(null);
        setCourtOptions([]);
        setUserName('');
        setUserPhone('');
        setUserEmail('');
      }
    } catch (err) {
      // El error de la API (ej. "Slot already booked") se mostrará aquí
      setBookingError(err.message || 'Ocurrió un error al crear la reserva.');
    } finally {
      setIsBooking(false);
    }
  };
  // --- FIN DE LA FUNCIÓN MODIFICADA ---


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

      {/* --- BOTÓN DE INSTALAR PWA --- */}
      {showInstallButton && (
        <button
          onClick={handleInstallClick}
          className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg text-lg transition-transform transform hover:scale-105 duration-300 shadow-lg flex items-center justify-center mx-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 mr-2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Instalar Aplicación
        </button>
      )}
      {/* --- FIN BOTÓN PWA --- */}
      
      {/* GRILLAS DE HORARIOS */}
      <div>
        <h3 className="text-xl font-semibold text-text-primary mb-4">Selecciona los horarios (puedes elegir varios seguidos)</h3>
        
        {loadingSlots && <p className="text-text-secondary text-center">Cargando turnos...</p>}
        {/*
          Este es el error que ves en la foto. 
          Ahora mostrará el mensaje específico del backend (ej. "El turno ya está ocupado")
        */}
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
            {/* --- Error de booking general --- */}
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
              {/* --- CAMPO DE EMAIL (OPCIONAL) --- */}
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-text-secondary">Email (Opcional)</label>
                <input type="email" id="userEmail" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Para recibir comprobante de Mercado Pago" className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" />
              </div>
              {/* ------------------------- */}
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
                {isBooking ? 'Generando pago...' : 'Pagar con Mercado Pago'}
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default TimeSlotFinder;
