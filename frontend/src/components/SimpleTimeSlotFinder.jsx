// frontend/src/components/SimpleTimeSlotFinder.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { format, addDays, startOfToday, isBefore, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';
import { getAggregatedAvailability } from '../services/courtService';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import toast from 'react-hot-toast';
// import { useNavigate, useLocation } from 'react-router-dom'; // No necesitamos useNavigate ni useLocation aquí
import { useAuth } from '../contexts/AuthContext';
import BookingModal from './BookingModal';
import bookingService from '../services/bookingService'; // Importar el servicio de reservas

const SimpleTimeSlotFinder = ({ slotDuration, currency, clubWhatsApp }) => { // Añadido clubWhatsApp
  const { user, authLoading } = useAuth();
  // const navigate = useNavigate(); // Ya no se usa
  // const location = useLocation(); // Ya no se usa
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBookingDetails, setModalBookingDetails] = useState(null);

  const fetchAvailability = useCallback(async (date) => {
    if (!date) return;
    
    setLoadingSlots(true);
    setError(null);
    setAvailableSlots([]);
    
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      const data = await getAggregatedAvailability(dateString); 
      
      const now = new Date();
      const processedSlots = data.availableSlots.map(slot => {
        if (!slot.dateTimeISO) {
            console.warn("Backend no devolvió dateTimeISO para el slot:", slot);
             const fallbackDate = new Date(date);
             fallbackDate.setHours(slot.hour, slot.minute, 0, 0);
             const isPastFallback = isBefore(fallbackDate, now);
             return {
                 ...slot,
                 dateTimeISO: fallbackDate.toISOString(),
                 isAvailable: slot.availableCourts > 0 && !isPastFallback,
                 isPast: isPastFallback,
             };
        }
        
        const slotDateTime = parseISO(slot.dateTimeISO);
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
    } finally {
      setLoadingSlots(false);
    }
  }, []);

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
     if (authLoading) { // Si estamos cargando el estado de auth, esperamos
         toast('Cargando estado de usuario, por favor espera...');
         return; 
     }

     if (!slot.isAvailable) {
         toast.error(slot.isPast ? 'Este horario ya pasó.' : 'Este horario no está disponible.');
         return;
     }

     // Ya no redirigimos al login aquí. El modal se abrirá de todas formas.
     const timeString = `${String(slot.hour).padStart(2, '0')}:${String(slot.minute).padStart(2, '0')}`;
     setModalBookingDetails({
         date: format(selectedDate, 'yyyy-MM-dd'),
         time: timeString,
         courtId: null, // Asignación automática en backend
         price: null, // El modal debería calcular o mostrar "a confirmar"
         slotData: slot, // Pasamos el slot completo si el modal necesita más detalles
     });
     setIsModalOpen(true);
  };

  const handleModalClose = () => {
      setIsModalOpen(false);
      setModalBookingDetails(null);
  };
  
  // Esta es la función que se llamará cuando el modal confirme la reserva
  const handleBookingSubmit = async (bookingData) => {
      try {
          // Si el usuario está logueado, podríamos añadir el userId automáticamente
          const finalBookingData = {
              ...bookingData,
              userId: user ? user._id : undefined, // Añadir userId si el usuario está logueado
          };

          if (finalBookingData.paymentMethod === 'cash') {
              toast('Procesando reserva en efectivo...');
              await bookingService.createCashBooking(finalBookingData);
              toast.success('Reserva en efectivo confirmada. Recibirás un mensaje de WhatsApp.');
              // Aquí podrías generar el mensaje de WhatsApp al club
              const whatsappMessage = `¡Nueva reserva en efectivo!\nFecha: ${finalBookingData.date}\nHora: ${finalBookingData.time}\nCliente: ${finalBookingData.clientName} ${finalBookingData.clientLastName}\nTeléfono: ${finalBookingData.clientPhone}`;
              const whatsappLink = `https://wa.me/${clubWhatsApp}?text=${encodeURIComponent(whatsappMessage)}`;
              window.open(whatsappLink, '_blank'); // Abrir WhatsApp en nueva pestaña
          } else if (finalBookingData.paymentMethod === 'mercadopago') {
              toast('Redirigiendo a Mercado Pago...');
              const mpUrl = await bookingService.createMercadoPagoBooking(finalBookingData);
              window.location.href = mpUrl; // Redirigir a Mercado Pago
          } else {
              throw new Error('Método de pago no válido.');
          }
          
          handleModalClose();
          fetchAvailability(selectedDate); // Recargar disponibilidad después de la reserva
      } catch (err) {
          const errorMessage = err.message || 'Error al procesar la reserva.';
          toast.error(errorMessage);
          console.error('Error al procesar reserva:', err);
      }
  };

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd');

  return (
    <>
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg shadow-lg border border-gray-700 text-white">
        {/* Selector de Fecha */}
        <div className="mb-6 flex justify-between items-center bg-gray-900 p-3 rounded-md shadow">
          <button 
            onClick={() => handleDateChange(-1)} 
            disabled={isToday || loadingSlots || authLoading}
            className={`p-2 rounded-full transition-colors ${
              (isToday || loadingSlots || authLoading)
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
            disabled={loadingSlots || authLoading}
            className={`p-2 rounded-full transition-colors ${
                (loadingSlots || authLoading) 
                    ? 'text-gray-600 cursor-not-allowed'
                    : 'text-purple-400 hover:bg-gray-700'
            }`}
            aria-label="Día siguiente"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Indicador de Carga o Error */}
        {loadingSlots && <InlineLoading text="Buscando horarios..." />}
        {error && !loadingSlots && <ErrorMessage message={error} />}
        {authLoading && !loadingSlots && <InlineLoading text="Verificando sesión..." />}

        {/* Grilla de Horarios */}
        {!loadingSlots && !error && !authLoading && (
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
                    disabled={!slot.isAvailable || authLoading}
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
      {isModalOpen && modalBookingDetails && ( // No necesitamos que el usuario esté logueado para abrir el modal
          <BookingModal
              isOpen={isModalOpen}
              onClose={handleModalClose}
              courtId={null} 
              date={modalBookingDetails.date}
              time={modalBookingDetails.time}
              price={null} // El modal debe calcular o mostrar "a confirmar"
              userPhone={user?.phone || ''} // Usar user?.phone para evitar errores si user es null
              userName={user?.name || ''}
              userLastName={user?.lastName || ''}
              onSubmit={handleBookingSubmit}
              currency={currency}
              slotDuration={slotDuration}
              // Puedes pasar el slot completo si es necesario para cálculos de precio en el modal
              // slotDetails={modalBookingDetails.slotData} 
          />
      )}
    </>
  );
};

export default SimpleTimeSlotFinder;
