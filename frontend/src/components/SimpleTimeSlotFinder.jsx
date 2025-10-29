// frontend/src/components/SimpleTimeSlotFinder.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfToday, isBefore, parseISO } from 'date-fns'; // <--- parseISO añadido
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { getAggregatedAvailability } from '../services/courtService';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BookingModal from './BookingModal'; // <--- Importar el modal existente

const SimpleTimeSlotFinder = ({ slotDuration }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Para posible redirección post-login
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);

  // --- Estados para el Modal ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBookingDetails, setModalBookingDetails] = useState(null); // { date: 'YYYY-MM-DD', time: 'HH:MM' }
  // --- Fin Estados para el Modal ---

  const fetchAvailability = useCallback(async (date) => {
    if (!date) return;
    
    setLoadingSlots(true);
    setError(null);
    setAvailableSlots([]);
    
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      // Asegurarse que el backend devuelve dateTimeISO para cada slot
      const data = await getAggregatedAvailability(dateString); 
      
      const now = new Date();
      // Usar dateTimeISO del backend para la validación de hora pasada
      const processedSlots = data.availableSlots.map(slot => {
        // Asumiendo que el backend ahora devuelve dateTimeISO
        if (!slot.dateTimeISO) {
            console.warn("Backend no devolvió dateTimeISO para el slot:", slot);
             // Fallback MUY BÁSICO si falta dateTimeISO (puede fallar en medianoche)
             const fallbackDate = new Date(date);
             fallbackDate.setHours(slot.hour, slot.minute, 0, 0);
             const isPastFallback = isBefore(fallbackDate, now);
             return {
                 ...slot,
                 dateTimeISO: fallbackDate.toISOString(), // Añadir un ISO de fallback
                 isAvailable: slot.availableCourts > 0 && !isPastFallback,
                 isPast: isPastFallback,
             };
        }
        
        const slotDateTime = parseISO(slot.dateTimeISO); // Convertir ISO string a Date
        const isPast = isBefore(slotDateTime, now);
        
        return {
          ...slot,
          isAvailable: slot.availableCourts > 0 && !isPast,
          isPast: isPast
        };
      });
      
      setAvailableSlots(processedSlots);
      
    } catch (err) {
      console.error("Error fetching aggregated availability:", err);
      const errorMessage = err.response?.data?.message || err.message || 'No se pudo cargar la disponibilidad.';
      setError(errorMessage);
      // No mostramos toast aquí, el ErrorMessage es suficiente
    } finally {
      setLoadingSlots(false);
    }
  }, []); // Dependencias vacías

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  const handleDateChange = (daysToAdd) => {
    const newDate = addDays(selectedDate, daysToAdd);
    if (isBefore(newDate, startOfToday())) {
      return; 
    }
    setSelectedDate(newDate);
  };

  const handleSlotSelect = (slot) => {
     if (!slot.isAvailable) {
         toast.error(slot.isPast ? 'Este horario ya pasó.' : 'Este horario no está disponible.');
         return;
     }

     if (!user) {
         toast.error('Debes iniciar sesión para poder reservar.');
         // Guardar la intención de reserva y redirigir
         sessionStorage.setItem('bookingIntent', JSON.stringify({ 
             date: format(selectedDate, 'yyyy-MM-dd'), 
             time: `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`
         }));
         navigate('/login', { state: { from: location } });
         return;
     }

     // --- Abrir el Modal ---
     const timeString = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
     setModalBookingDetails({
         date: format(selectedDate, 'yyyy-MM-dd'),
         time: timeString,
         // Pasamos null para courtId y price, el modal o el backend lo resolverán
         courtId: null, 
         price: null, // El modal debería calcularlo o mostrar "a confirmar"
     });
     setIsModalOpen(true);
     // --- Fin Abrir el Modal ---
  };

  const handleModalClose = () => {
      setIsModalOpen(false);
      setModalBookingDetails(null);
      // Opcional: Recargar disponibilidad por si algo cambió
      // fetchAvailability(selectedDate); 
  };
  
  // Función que se pasará al modal para ejecutar al confirmar la reserva
  const handleBookingSubmit = async (bookingData) => {
      console.log("Datos a enviar desde el modal:", bookingData);
      // Aquí iría la lógica para llamar al backend (bookingService.createBooking)
      // Por ahora, solo cerramos el modal y mostramos éxito
      toast.success("Reserva procesada (simulado).");
      handleModalClose();
      fetchAvailability(selectedDate); // Recargar disponibilidad
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd');

  return (
    <> {/* Fragmento para envolver el div y el modal */}
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700 text-white">
        {/* Selector de Fecha */}
        <div className="mb-6 flex justify-between items-center bg-gray-900 p-3 rounded-md shadow">
          <button 
            onClick={() => handleDateChange(-1)} 
            disabled={isToday}
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
                No hay horarios disponibles para este día.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Renderizar el Modal */}
      {modalBookingDetails && user && (
          <BookingModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              // --- Props adaptados para BookingModal ---
              courtId={null} // Pasamos null, el modal o backend decidirá la cancha
              date={modalBookingDetails.date} // Formato YYYY-MM-DD
              time={modalBookingDetails.time} // Formato HH:MM
              price={null} // El modal debe calcular o mostrar "a confirmar"
              userPhone={user.phone || ''} // Usar datos del usuario logueado
              userName={user.name || ''}
              userLastName={user.lastName || ''} // Añadido si existe en tu modelo User
              onSubmit={handleBookingSubmit} // Función para manejar la confirmación
          />
      )}
    </>
  );
};

export default SimpleTimeSlotFinder;
