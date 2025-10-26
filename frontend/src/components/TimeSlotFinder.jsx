import React, { useState, useEffect, useCallback } from 'react';
import { getAggregatedAvailability } from '../services/courtService';
import { addDays, format, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import BookingModal from './BookingModal';
import { Calendar, Clock, ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';

const TimeSlotFinder = ({ settings }) => {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availability, setAvailability] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const today = startOfToday();
  const maxBookingDays = settings.bookingLeadTime || 7;
  // Convertir slotDuration a número una sola vez
  const slotDurationMinutes = parseInt(settings.slotDuration, 10) || 30; // Usar 30 como default si falla

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAggregatedAvailability(selectedDate);
      setAvailability(Array.isArray(data) ? data : []); // Asegurar que sea array
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
    // Limpiar errores anteriores al hacer clic
    setError(null);
    
    const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);

    let newSlots;
    if (isSelected) {
      // Deseleccionar
      newSlots = selectedSlots.filter(s => s.startTime !== slot.startTime);
    } else {
      // Seleccionar
      newSlots = [...selectedSlots, { ...slot, date: selectedDate }]; // Añadir fecha aquí
    }

    // Ordenar SIEMPRE antes de validar consecutividad
    const sortedNewSlots = sortSlots(newSlots);

    // Validar consecutividad SOLO si hay más de un slot
    if (sortedNewSlots.length > 1) {
      // Pasamos la duración como NÚMERO
      if (!areSlotsConsecutive(sortedNewSlots, slotDurationMinutes)) {
        setError('Solo puedes seleccionar turnos consecutivos.');
        // No actualizamos selectedSlots si la validación falla al añadir
        if (!isSelected) return; 
      }
    }

    // Actualizar estado solo si pasa la validación (o si estamos deseleccionando)
    setSelectedSlots(sortedNewSlots);
  };

  const sortSlots = (slots) => {
    // Asegurarse de que startTime sea string antes de comparar
    return slots.sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
  };

  // --- FUNCIÓN areSlotsConsecutive CORREGIDA (con logs) ---
  const areSlotsConsecutive = (sortedSlots, duration) => {
    // CORRECCIÓN: Asegurar que duration sea un número
    const numericDuration = typeof duration === 'number' ? duration : parseInt(duration, 10);
    
    console.log('🔍 Validando slots:', sortedSlots.map(s => s.startTime));
    console.log('📏 Duración esperada (número):', numericDuration); // Log del número
    
    if (isNaN(numericDuration) || numericDuration <= 0) {
        console.error('❌ Duración inválida:', duration);
        setError('Error interno: Duración del turno inválida en la configuración.');
        return false; // No continuar si la duración no es válida
    }

    for (let i = 1; i < sortedSlots.length; i++) {
      // Usar fecha base para evitar problemas de cambio de día
      const prevTime = new Date(`1970-01-01T${sortedSlots[i-1].startTime}`);
      const currTime = new Date(`1970-01-01T${sortedSlots[i].startTime}`);
      
      // Validar que las fechas sean válidas
      if (isNaN(prevTime) || isNaN(currTime)) {
          console.error('❌ Fechas inválidas para comparar:', sortedSlots[i-1].startTime, sortedSlots[i].startTime);
          setError('Error interno: Formato de hora inválido.');
          return false;
      }
      
      const diffMinutes = (currTime - prevTime) / 60000;
      
      console.log(`⏰ Diferencia entre ${sortedSlots[i-1].startTime} y ${sortedSlots[i].startTime}: ${diffMinutes} minutos`);
      
      // Comparamos números
      if (diffMinutes !== numericDuration) {
        console.log(`❌ No son consecutivos! (Esperado: ${numericDuration}, Obtenido: ${diffMinutes})`);
        return false;
      }
    }
    console.log('✅ Todos los slots son consecutivos');
    return true;
  };
  // --- FIN DE FUNCIÓN CORREGIDA ---

  const handleOpenModal = () => {
    if (selectedSlots.length > 0) {
      // Revalidar antes de abrir, por si acaso
      if (selectedSlots.length > 1 && !areSlotsConsecutive(selectedSlots, slotDurationMinutes)) {
         setError('Los turnos seleccionados deben ser consecutivos.');
         return;
      }
      setError(null); // Limpiar error si todo OK
      setIsModalOpen(true);
    }
  };

  const totalSlots = selectedSlots.length;
  const totalPrice = selectedSlots.reduce((total, slot) => total + (slot.price || 0), 0);
  const totalDuration = totalSlots * slotDurationMinutes;

  const dateForDisplay = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
      {/* Mostramos el error de consecutividad aquí */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Selector de Fecha */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
          1. Selecciona una Fecha
        </label>
        {/* ... (código del selector de fecha sin cambios) ... */}
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

      {/* Solo mostramos la grilla si no hay error de carga inicial */}
      {!error && (
          <>
            <label className="block text-sm font-medium text-gray-300 mb-2">
                2. Selecciona uno o más turnos (consecutivos)
            </label>
            {/* Grilla de Turnos */}
            {loading ? (
                <InlineLoading text="Buscando turnos disponibles..." />
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availability.map((slot) => {
                    const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);
                    return (
                    <button
                        key={slot.startTime}
                        onClick={() => handleSlotClick(slot)}
                        disabled={!slot.isAvailable}
                        className={`p-3 rounded-md text-center font-semibold transition-all
                        ${
                            !slot.isAvailable
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed line-through'
                            : isSelected
                            ? 'bg-yellow-500 hover:bg-yellow-400 text-gray-900 ring-2 ring-white' // Estilo seleccionado
                            : 'bg-green-600 hover:bg-green-500 text-white cursor-pointer' // Estilo disponible
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
      {selectedSlots.length > 0 && !error && ( // Ocultar si hay error
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
          settings={settings} // Pasar settings al modal
          onClose={() => setIsModalOpen(false)}
          onBookingSuccess={() => {
            setIsModalOpen(false);
            fetchAvailability(); // Refresca la lista de turnos
          }}
        />
      )}
    </div>
  );
};

export default TimeSlotFinder;
