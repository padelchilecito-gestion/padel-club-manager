// frontend/src/components/TimeSlotFinder.jsx - CORREGIDO
import React, { useState, useEffect, useCallback } from 'react';
import socket from '../services/socketService';
// --- INICIO DE CORRECCIÓN ---
// Importar la función correcta desde el servicio correcto
import { checkAvailability } from '../services/bookingService'; 
// --- FIN DE CORRECCIÓN ---
import { addDays, format, isBefore, startOfToday, parseISO } from 'date-fns'; 
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, ClockIcon } from '@heroicons/react/24/solid';
import { InlineLoading } from './ui/Feedback'; // Asumiendo que Feedback.jsx está en ui

const TimeSlotFinder = ({ selectedCourtId, onSlotSelect, selectedDate: initialDate, selectedTime: initialTime }) => {
  const [selectedDate, setSelectedDate] = useState(initialDate ? parseISO(initialDate) : startOfToday());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState(initialTime || null);

  // Función para cargar slots disponibles
  const fetchAvailableSlots = useCallback(async (date) => {
    if (!selectedCourtId) {
        setAvailableSlots([]);
        return;
    }
    setLoadingSlots(true);
    try {
      // --- CORRECCIÓN: Usar la función correcta ---
      const data = await checkAvailability(selectedCourtId, date.toISOString());
      // --- ---
      setAvailableSlots(data.availableSlots || []);
    } catch (error) {
      console.error("Error fetching availability:", error);
      setAvailableSlots([]); // Limpiar en caso de error
    } finally {
      setLoadingSlots(false);
    }
  }, [selectedCourtId]); // Depende solo de courtId

  // Cargar slots cuando cambia la cancha o la fecha
  useEffect(() => {
    fetchAvailableSlots(selectedDate);
  }, [selectedCourtId, selectedDate, fetchAvailableSlots]);

  // Actualización por Socket.IO
  useEffect(() => {
    socket.connect();
    const handleBookingUpdate = (/* updatedBooking */) => {
      // Recargar disponibilidad si hubo un cambio (podría afectar slots futuros)
      fetchAvailableSlots(selectedDate);
    };
    socket.on('booking_update', handleBookingUpdate);
    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect();
    };
  }, [selectedDate, fetchAvailableSlots]); // Depende de la fecha y la función de fetch

  const handleDateChange = (days) => {
    const newDate = addDays(selectedDate, days);
    // No permitir seleccionar fechas pasadas
    if (isBefore(newDate, startOfToday()) && !isSameDay(newDate, startOfToday())) {
      return; 
    }
    setSelectedDate(newDate);
    setSelectedTime(null); // Resetear hora seleccionada al cambiar fecha
    onSlotSelect(newDate, null); // Informar al modal que la hora se reseteó
  };

  const handleTimeSelect = (slot) => {
    const timeString = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;
    setSelectedTime(timeString);
    onSlotSelect(selectedDate, timeString); // Pasar fecha y hora al modal
  };

  // Helper para verificar si dos fechas son el mismo día
  const isSameDay = (date1, date2) => {
    return format(date1, 'yyyy-MM-dd') === format(date2, 'yyyy-MM-dd');
  };
  
  const canGoBack = !isSameDay(selectedDate, startOfToday());


  return (
    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold text-cyan-400 mb-3">Seleccionar Horario</h3>
      
      {/* Selector de Fecha */}
      <div className="mb-4 flex justify-between items-center bg-gray-900 p-2 rounded-md">
        <button 
          onClick={() => handleDateChange(-1)} 
          disabled={!canGoBack}
          className={`p-2 rounded-full hover:bg-gray-700 transition-colors ${!canGoBack ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <ChevronLeftIcon className="h-5 w-5 text-white" />
        </button>
        <span className="text-white font-medium capitalize">
          {format(selectedDate, 'EEEE dd MMM', { locale: es })}
        </span>
        <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
          <ChevronRightIcon className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Lista de Horarios */}
      {loadingSlots ? (
        <InlineLoading text="Buscando horarios..." />
      ) : (
        <div className="max-h-60 overflow-y-auto pr-2 grid grid-cols-3 gap-2">
          {availableSlots.length > 0 ? (
            availableSlots.map((slot, index) => {
              const timeString = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;
              const isSelected = selectedTime === timeString;
              return (
                <button
                  key={index}
                  onClick={() => handleTimeSelect(slot)}
                  className={`py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-cyan-500 text-white shadow-lg'
                      : 'bg-gray-700 text-gray-200 hover:bg-cyan-700 hover:text-white'
                  }`}
                >
                  {timeString}
                </button>
              );
            })
          ) : (
            <p className="text-gray-400 col-span-3 text-center py-4">
              {selectedCourtId ? 'No hay horarios disponibles para esta fecha.' : 'Selecciona una cancha primero.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default TimeSlotFinder;
