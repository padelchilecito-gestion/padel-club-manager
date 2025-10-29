// frontend/src/components/SimpleTimeSlotFinder.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfToday, isBefore, setHours, setMinutes, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { getAggregatedAvailability } from '../services/courtService'; // Usamos el servicio de canchas
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom'; // Para posible redirección a pago

// Importar el contexto de autenticación para saber si el usuario está logueado
import { useAuth } from '../contexts/AuthContext';

const SimpleTimeSlotFinder = ({ slotDuration }) => {
  const { user } = useAuth(); // Obtener información del usuario logueado
  const navigate = useNavigate(); // Hook para navegar
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);
  
  // Función para cargar la disponibilidad agregada
  const fetchAvailability = useCallback(async (date) => {
    if (!date) return;
    
    setLoadingSlots(true);
    setError(null);
    setAvailableSlots([]); // Limpiar slots anteriores
    
    try {
      // Formatear fecha como YYYY-MM-DD para la API
      const dateString = format(date, 'yyyy-MM-dd');
      const data = await getAggregatedAvailability(dateString); 
      
      // Procesar slots: Marcar como no disponibles los que ya pasaron
      const now = new Date();
      const processedSlots = data.availableSlots.map(slot => {
        const slotDateTime = setMinutes(setHours(date, slot.hour), slot.minute);
        const isPast = isBefore(slotDateTime, now);
        return {
          ...slot,
          isAvailable: slot.availableCourts > 0 && !isPast, // Disponible si hay canchas Y no ha pasado
          isPast: isPast
        };
      });
      
      setAvailableSlots(processedSlots);
      
    } catch (err) {
      console.error("Error fetching aggregated availability:", err);
      const errorMessage = err.response?.data?.message || err.message || 'No se pudo cargar la disponibilidad.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoadingSlots(false);
    }
  }, []); // Dependencias vacías ya que usa 'getAggregatedAvailability' directamente

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  // Manejar cambio de fecha con botones
  const handleDateChange = (daysToAdd) => {
    const newDate = addDays(selectedDate, daysToAdd);
    // No permitir ir a días anteriores a hoy
    if (isBefore(newDate, startOfToday())) {
      return; 
    }
    setSelectedDate(newDate);
  };

  // Manejar selección de un slot
  const handleSlotSelect = (slot) => {
     if (!slot.isAvailable) {
         toast.error('Este horario no está disponible.');
         return;
     }

     // 1. Verificar si el usuario está logueado
     if (!user) {
         toast.error('Debes iniciar sesión para poder reservar.');
         // Opcional: Redirigir a login guardando la intención
         // navigate('/login', { state: { from: location, bookingIntent: { date: selectedDate, time: slot } } });
         navigate('/login'); // Redirección simple por ahora
         return;
     }

     // 2. Construir la información de la reserva
     const timeString = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
     const bookingDetails = {
         date: format(selectedDate, 'yyyy-MM-dd'),
         time: timeString,
         // Aquí podrías calcular el precio si es necesario, usando slotDuration y precio por hora (necesitaría venir de settings)
     };

     console.log('Slot seleccionado:', bookingDetails);
     toast.success(`Has seleccionado el turno de las ${timeString}hs.`);
     
     // 3. TODO: Abrir Modal de Confirmación y Pago
     // Aquí deberías abrir un modal similar al BookingModal, pasando 'bookingDetails'.
     // El modal manejaría la confirmación y la elección de pago (Efectivo / MP).
     // Por ahora, solo mostramos un toast.
     alert(`Reserva:\nFecha: ${bookingDetails.date}\nHora: ${bookingDetails.time}\n\nSiguiente paso: Mostrar modal de pago.`);

  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd');

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 text-white">
      {/* Selector de Fecha */}
      <div className="mb-6 flex justify-between items-center bg-gray-900 p-3 rounded-md shadow">
        <button 
          onClick={() => handleDateChange(-1)} 
          disabled={isToday} // Deshabilitar si es hoy
          className={`p-2 rounded-full transition-colors ${
            isToday 
              ? 'text-gray-600 cursor-not-allowed' 
              : 'text-purple-400 hover:bg-gray-700'
          }`}
          aria-label="Día anterior"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        
        <span className="text-lg font-semibold capitalize text-center">
          {format(selectedDate, 'EEEE dd MMM', { locale: es })}
        </span>
        
        <button 
          onClick={() => handleDateChange(1)} 
          className="p-2 rounded-full text-purple-400 hover:bg-gray-700 transition-colors"
          aria-label="Día siguiente"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Indicador de Carga o Error */}
      {loadingSlots && <InlineLoading text="Buscando horarios..." />}
      {error && !loadingSlots && <ErrorMessage message={error} />}

      {/* Grilla de Horarios */}
      {!loadingSlots && !error && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {availableSlots.length > 0 ? (
            availableSlots.map((slot, index) => {
              const timeString = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
              
              // Determinar clases de estilo según disponibilidad y si ya pasó
              let buttonClasses = "py-3 px-2 rounded-md text-sm font-medium transition-colors text-center shadow ";
              if (slot.isAvailable) {
                buttonClasses += "bg-green-600 hover:bg-green-700 text-white cursor-pointer";
              } else {
                buttonClasses += "bg-gray-600 text-gray-400 opacity-70 cursor-not-allowed";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={!slot.isAvailable}
                  className={buttonClasses}
                  title={slot.isAvailable ? `${slot.availableCourts} cancha(s) disponible(s)` : (slot.isPast ? 'Horario pasado' : 'Completo')}
                >
                  {timeString}
                </button>
              );
            })
          ) : (
            <p className="text-gray-400 col-span-3 sm:col-span-4 text-center py-8">
              No hay horarios calculados para este día o el club está cerrado.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimpleTimeSlotFinder;
