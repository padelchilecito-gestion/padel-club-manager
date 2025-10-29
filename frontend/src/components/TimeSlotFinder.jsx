// frontend/src/components/TimeSlotFinder.jsx
// ESTA ES LA VERSIÓN CORREGIDA PARA LA PÁGINA PRINCIPAL

import React, { useState, useEffect, useCallback } from 'react';
import { DayPicker } from 'react-day-picker'; // Importar el calendario
import 'react-day-picker/dist/style.css'; // Importar estilos
import { format, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
// Importar la función CORRECTA para la disponibilidad agregada
import { getAggregatedAvailability } from '../services/courtService'; 
import { InlineLoading } from './ui/Feedback';

// Este componente recibe la configuración del club desde HomePage
const TimeSlotFinder = ({ settings }) => {
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [error, setError] = useState(null);

  // Función para cargar la disponibilidad *agregada* (de todas las canchas)
  const fetchAvailability = useCallback(async (date) => {
    if (!date) return;
    
    setLoadingSlots(true);
    setError(null);
    try {
      const dateString = date.toISOString();
      // Usamos la función del courtService, no del bookingService
      const data = await getAggregatedAvailability(dateString); 
      setAvailableSlots(data.availableSlots || []);
    } catch (err) {
      console.error("Error fetching aggregated availability:", err);
      setError('No se pudo cargar la disponibilidad.');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, []); // No depende de nada, es autónomo

  // Cargar slots cuando cambia la fecha
  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate, fetchAvailability]);

  // --- LA CORRECCIÓN PRINCIPAL ---
  // Esta función es la que maneja el clic en el calendario.
  // Se pasa la referencia de la función (handleDateChange)
  // y no su ejecución (handleDateChange()).
  const handleDateChange = (date) => {
    if (date) {
      setSelectedDate(date);
      // La disponibilidad se cargará automáticamente por el useEffect
    }
  };

  // Función para deshabilitar días pasados en el calendario
  const isDateDisabled = (date) => {
    return isBefore(date, startOfToday());
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Columna 1: Calendario */}
      <div className="bg-white p-4 rounded-lg shadow-lg flex justify-center">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDateChange} // <-- LA LÍNEA CRÍTICA CORREGIDA
          disabled={isDateDisabled}
          locale={es}
          className="text-gray-900"
          footer={<p className="text-sm text-center text-gray-600 mt-2">Selecciona un día para ver horarios.</p>}
        />
      </div>

      {/* Columna 2: Horarios Disponibles */}
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
        <h3 className="text-xl font-semibold text-cyan-400 mb-4 capitalize">
          Horarios para el {format(selectedDate, 'EEEE dd MMM', { locale: es })}
        </h3>
        
        {loadingSlots ? (
          <InlineLoading text="Buscando horarios..." />
        ) : error ? (
           <p className="text-red-400 text-center">{error}</p>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-2 grid grid-cols-3 gap-3">
            {availableSlots.length > 0 ? (
              availableSlots.map((slot, index) => {
                // Formatear la hora
                const timeString = `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;
                const hasAvailability = slot.availableCourts > 0;
                
                return (
                  <div
                    key={index}
                    className={`py-2 px-3 rounded-md text-sm font-medium text-center shadow ${
                      hasAvailability
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-600 text-gray-400 opacity-70'
                    }`}
                    title={hasAvailability ? `${slot.availableCourts} cancha(s) disponible(s)` : 'Completo'}
                  >
                    <div className="font-bold">{timeString}</div>
                    <div className="text-xs opacity-90">
                      {hasAvailability
                        ? `${slot.availableCourts} cancha${slot.availableCourts > 1 ? 's' : ''}`
                        : 'Completo'}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 col-span-3 text-center py-8">
                No hay horarios disponibles para este día.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeSlotFinder;
