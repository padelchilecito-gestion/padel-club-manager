import React, { useState, useEffect, useCallback } from 'react';
import socket from '../services/socketService';
import { getAggregatedAvailability } from '../services/courtService';
import { addDays, format, isBefore, startOfToday, parseISO } from 'date-fns'; 
import { es } from 'date-fns/locale';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import BookingModal from './BookingModal';
import { Calendar, Clock, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

// --- NUEVA FUNCIÓN HELPER ---
// Parsea "HH:mm" a minutos totales. Ej: "17:30" -> 1050
const parseTimeToMinutes = (timeStr) => {
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      return NaN;
    }
    return (hours * 60) + minutes;
  } catch (e) {
    console.error('Error parsing time:', timeStr);
    return NaN;
  }
};
// --- FIN FUNCIÓN HELPER ---

const TimeSlotFinder = ({ settings }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availability, setAvailability] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = startOfToday();
  const maxBookingDays = settings.bookingLeadTime || 7;
  const slotDurationMinutes = parseInt(settings.slotDuration, 10) || 30;

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAggregatedAvailability(selectedDate);
      setAvailability(Array.isArray(data) ? data : []);
      setSelectedSlots([]);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar la disponibilidad';
      setError(errorMsg);
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  useEffect(() => {
    socket.connect();

    const handleBookingUpdate = async (newBooking) => {
      console.log('🔔 Reserva recibida por Socket.IO:', newBooking);
      const bookingDate = format(parseISO(newBooking.startTime), 'yyyy-MM-dd');
      
      if (bookingDate !== selectedDate) {
        console.log('📅 Reserva es de otra fecha, ignorando');
        return;
      }
      
      console.log('🔄 Recargando disponibilidad por socket...');
      try {
        const data = await getAggregatedAvailability(selectedDate);
        setAvailability(Array.isArray(data) ? data : []);
        console.log('✅ Disponibilidad actualizada desde el servidor');
      } catch (err) {
        console.error('❌ Error recargando disponibilidad:', err);
      }
    };

    socket.on('booking_update', handleBookingUpdate);

    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect();
    };
    
  }, [selectedDate]); 

  const handleDateChange = (date) => {
    const newDate = new Date(date);
    if (isBefore(newDate, today)) {
      setSelectedDate(format(today, 'yyyy-MM-dd'));
    } else {
      setSelectedDate(date);
    }
  };

  const handleDayShift = (days) => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const newDate = addDays(currentDate, days);

    if (isBefore(newDate, today)) {
      setSelectedDate(format(today, 'yyyy-MM-dd'));
    } else {
      setSelectedDate(format(newDate, 'yyyy-MM-dd'));
    }
  };

  const handleSlotClick = (slot) => {
    setError(null);
    
    const isTrulyAvailable = slot.availableCount !== undefined ? slot.availableCount > 0 : slot.isAvailable;
    if (!isTrulyAvailable) {
        setError("Este turno ya no está disponible.");
        fetchAvailability();
        return;
    }

    const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);

    let newSlots;
    if (isSelected) {
      newSlots = selectedSlots.filter(s => s.startTime !== slot.startTime);
    } else {
      newSlots = [...selectedSlots, { ...slot, date: selectedDate }];
    }

    const sortedNewSlots = sortSlots(newSlots);

    if (sortedNewSlots.length > 1) {
      // Usamos la duración en minutos
      if (!areSlotsConsecutive(sortedNewSlots, slotDurationMinutes)) {
        setError('Solo puedes seleccionar turnos consecutivos.');
        // No actualizamos selectedSlots si la validación falla al añadir
        if (!isSelected) return; 
      }
    }

    setSelectedSlots(sortedNewSlots);
  };

  const sortSlots = (slots) => {
    return slots.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  };

  // --- FUNCIÓN areSlotsConsecutive CORREGIDA ---
  // (Usa la nueva función helper y evita usar new Date())
  const areSlotsConsecutive = (sortedSlots, duration) => {
    // 1. Asegurar que 'duration' sea un número
    const numericDuration = typeof duration === 'number' ? duration : parseInt(duration, 10);
    
    if (isNaN(numericDuration) || numericDuration <= 0) {
        console.error('Duración inválida:', duration);
        setError('Error interno: Duración del turno inválida en la configuración.');
        return false;
    }

    for (let i = 1; i < sortedSlots.length; i++) {
      // 2. Convertir "HH:mm" a minutos
      const prevMinutes = parseTimeToMinutes(sortedSlots[i-1].startTime);
      const currMinutes = parseTimeToMinutes(sortedSlots[i].startTime);
      
      // 3. Validar que la conversión fue exitosa
      if (isNaN(prevMinutes) || isNaN(currMinutes)) {
          console.error('Fechas inválidas para comparar:', sortedSlots[i-1].startTime, sortedSlots[i].startTime);
          setError('Error interno: Formato de hora inválido.');
          return false;
      }
      
      // 4. Restar los minutos (matemática simple)
      const diffMinutes = currMinutes - prevMinutes;
      
      // 5. Comparar números
      if (diffMinutes !== numericDuration) {
        console.log(`Slots no consecutivos. Diferencia: ${diffMinutes}, Esperada: ${numericDuration}`);
        return false;
      }
    }
    // Si el bucle termina, son todos consecutivos
    return true;
  };
  // --- FIN DE LA CORRECCIÓN ---

  const handleOpenModal = () => {
    if (selectedSlots.length > 0) {
      if (selectedSlots.length > 1 && !areSlotsConsecutive(selectedSlots, slotDurationMinutes)) {
         setError('Los turnos seleccionados deben ser consecutivos.');
         return;
      }
      setError(null);
      setIsModalOpen(true);
    }
  };

  const totalSlots = selectedSlots.length;
  const totalPrice = selectedSlots.reduce((total, slot) => total + (slot.price || 0), 0);
  const totalDuration = totalSlots * slotDurationMinutes;

  const dateForDisplay = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Selector de Fecha */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
          1. Selecciona una Fecha
        </label>
         <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDayShift(-1)}
            disabled={loading || selectedDate === format(today, 'yyyy-MM-dd')}
            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="relative flex-grow">
            <input
              type="date"
              id="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={format(today, 'yyyy-MM-dd')}
              max={format(addDays(today, maxBookingDays), 'yyyy-MM-dd')}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={loading}
            />
          </div>
          <button
            onClick={() => handleDayShift(1)}
            disabled={loading || selectedDate === format(addDays(today, maxBookingDays), 'yyyy-MM-dd')}
            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="text-center text-lg font-semibold text-white mt-3">
          {format(dateForDisplay, "EEEE, dd 'de' MMMM", { locale: es })}
        </p>       
      </div>

      {!error && (
          <>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                2. Selecciona uno o más turnos (consecutivos)
            </label>
            {loading ? (
                <InlineLoading text="Buscando turnos disponibles..." />
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availability.map((slot) => {
                    const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);
                    const isTrulyAvailable = slot.availableCount !== undefined ? slot.availableCount > 0 : slot.isAvailable;
                    
                    return (
                    <button
                        key={slot.startTime}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!isTrulyAvailable}
                        className={`p-3 rounded-md text-center font-semibold transition-all
                        ${
                            !isTrulyAvailable
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 ring-2 ring-white'
                            : 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                        }
                        `}
                    >
                        <Clock size={16} className="inline-block mr-1 mb-0.5" />
                        {slot.startTime}
                    </button>
                    );
                })}
                {availability.length === 0 && !loading && (
                    <p className="text-gray-400 col-span-full text-center">
                    No hay turnos para mostrar en esta fecha.
                    </p>
                )}
                </div>
            )}
            </>
      )}

      {/* Resumen de Reserva */}
      {selectedSlots.length > 0 && !error && (
        <div className="mt-6 p-4 bg-gray-900 rounded-lg">
          <h3 className="text-lg font-semibold text-white mb-3">Tu Reserva</h3>
          <div className="flex justify-between items-center text-gray-300 mb-2">
            <span>Turnos seleccionados:</span>
            <span className="font-bold">{selectedSlots.map(s => s.startTime).join(', ')}</span>
          </div>
          <div className="flex justify-between items-center text-gray-300 mb-2">
            <span>Tiempo total:</span>
            <span className="font-bold">{totalDuration} minutos</span>
          </div>
          <div className="flex justify-between items-center text-xl text-white mt-3">
            <span className="font-bold">Total a Pagar:</span>
            <span className="font-bold text-green-400">${totalPrice}</span>
          </div>
          <button
            onClick={handleOpenModal}
            className="w-full mt-4 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-md transition-colors flex items-center justify-center"
          >
            <ShoppingCart size={18} className="mr-2" />
            Continuar Reserva
          </button>
        </div>
      )}

      {/* Modal de Reserva */}
      {isModalOpen && (
        <BookingModal
          slots={selectedSlots}
          settings={settings}
          onClose={() => setIsModalOpen(false)}
          onBookingSuccess={() => {
            setIsModalOpen(false);
            fetchAvailability();
          }}
        />
      )}
    </div>
  );
};

export default TimeSlotFinder;
