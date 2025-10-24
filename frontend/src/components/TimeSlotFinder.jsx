import React, { useState, useEffect, useCallback } from 'react';
import { getAggregatedAvailability } from '../services/courtService'; // Usamos la nueva función
import { addDays, format, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import BookingModal from './BookingModal'; // El modal reescrito
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

  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAggregatedAvailability(selectedDate);
      setAvailability(data);
      setSelectedSlots([]); 
    } catch (err) {
      // --- CORRECCIÓN DE MANEJO DE ERROR ---
      // Esto leerá el mensaje "La configuración del club no está completa."
      // que envía el backend y lo mostrará en la UI.
      const errorMsg = err.response?.data?.message || err.message || 'Error al cargar la disponibilidad';
      setError(errorMsg);
      // --- FIN DE CORRECCIÓN ---
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
    const isSelected = selectedSlots.some(s => s.startTime === slot.startTime);

    if (isSelected) {
      const newSlots = selectedSlots.filter(s => s.startTime !== slot.startTime);
      setSelectedSlots(sortSlots(newSlots));
    } else {
      const newSlots = [...selectedSlots, { ...slot, date: selectedDate }];
      
      if (newSlots.length > 1) {
        const sorted = sortSlots(newSlots);
        if (!areSlotsConsecutive(sorted, settings.slotDuration || 30)) {
          setError('Solo puedes seleccionar turnos consecutivos.');
          setTimeout(() => setError(null), 3000);
          return; 
        }
      }
      setSelectedSlots(sortSlots(newSlots));
    }
  };

  const sortSlots = (slots) => {
    return slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const areSlotsConsecutive = (sortedSlots, duration) => {
    for (let i = 1; i < sortedSlots.length; i++) {
      const prevTime = new Date(`1970-01-01T${sortedSlots[i-1].startTime}`);
      const currTime = new Date(`1970-01-01T${sortedSlots[i].startTime}`);
      const diffMinutes = (currTime - prevTime) / 60000;
      if (diffMinutes !== duration) {
        return false;
      }
    }
    return true;
  };

  const handleOpenModal = () => {
    if (selectedSlots.length > 0) {
      setIsModalOpen(true);
    }
  };

  const totalSlots = selectedSlots.length;
  const totalPrice = selectedSlots.reduce((total, slot) => total + slot.price, 0);
  const totalDuration = totalSlots * (settings.slotDuration || 30);

  const dateForDisplay = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
      {/* Ahora el error 400 mostrará un mensaje claro */}
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

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

      {!error && ( // No mostrar la grilla si hay un error de configuración
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

          {selectedSlots.length > 0 && (
            <div className="mt-6 p-4 bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold text-white mb-3">Tu Reserva</h3>
              <div className="flex justify-between items-center text-gray-300 mb-2">
                <span>Turnos seleccionados:</span>
                <span className="font-bold">{totalSlots}</span>
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
        </>
      )}

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
