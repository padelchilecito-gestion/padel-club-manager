import React, { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../services/bookingService';
import { addDays, format, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import BookingModal from './BookingModal';
import { Calendar, Clock, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

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
    setLoading(true);
    setError(null);
    setSelectedSlots([]); // Reset selection on date change
    try {
      const data = await bookingService.getAvailability(selectedDate);
      setAvailability(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Error al cargar la disponibilidad');
      setAvailability([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const handleSlotClick = (slot) => {
    if (!slot.isAvailable) return;

    const slotIdentifier = slot.startTime;
    const isSelected = selectedSlots.includes(slotIdentifier);

    if (isSelected) {
      setSelectedSlots(prev => prev.filter(s => s !== slotIdentifier));
    } else {
      // Allow selecting consecutive slots
      const newSelection = [...selectedSlots, slotIdentifier].sort();
      setSelectedSlots(newSelection);
    }
  };

  const handleBooking = () => {
    if (selectedSlots.length > 0) {
      setIsModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    setIsModalOpen(false);
    setSelectedSlots([]);
    fetchAvailability(); // Re-fetch to show updated availability
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-4xl mx-auto">
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Date Selector */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-lg font-bold text-gray-200 mb-2">
          1. Selecciona una Fecha
        </label>
        <div className="flex items-center space-x-2">
            <button
                onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), -1), 'yyyy-MM-dd'))}
                disabled={loading || isBefore(new Date(selectedDate), addDays(today, 1))}
                className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
                <ChevronLeft size={20} />
            </button>
            <input
                type="date"
                id="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(today, 'yyyy-MM-dd')}
                max={format(addDays(today, maxBookingDays), 'yyyy-MM-dd')}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white focus:outline-none focus:ring-indigo-500"
                disabled={loading}
            />
            <button
                onClick={() => setSelectedDate(format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd'))}
                disabled={loading || new Date(selectedDate) >= addDays(today, maxBookingDays)}
                className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50"
            >
                <ChevronRight size={20} />
            </button>
        </div>
      </div>

      {/* Time Slot Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-200 mb-3">2. Selecciona uno o más turnos</h3>
        {loading ? (
          <InlineLoading text="Buscando turnos..." />
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {availability.map((slot) => {
              const isSelected = selectedSlots.includes(slot.startTime);
              return (
                <button
                  key={slot.startTime}
                  onClick={() => handleSlotClick(slot)}
                  disabled={!slot.isAvailable}
                  className={`p-3 rounded-md text-center font-semibold transition-all duration-200 border-2
                    ${!slot.isAvailable ? 'bg-gray-700 text-gray-500 cursor-not-allowed line-through' : ''}
                    ${isSelected ? 'bg-indigo-500 border-indigo-300 ring-2 ring-indigo-300' : ''}
                    ${slot.isAvailable && !isSelected ? 'bg-green-600 hover:bg-green-500 border-transparent' : ''}
                  `}
                >
                  <Clock size={16} className="inline-block mr-1.5" />
                  {slot.startTime}
                </button>
              );
            })}
             {availability.length === 0 && !loading && (
                <div className="col-span-full bg-gray-700/50 p-4 rounded-md text-center text-gray-400 flex items-center justify-center">
                    <AlertCircle className="mr-2" />
                    No hay turnos disponibles para esta fecha.
                </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Action Button */}
      {selectedSlots.length > 0 && (
        <div className="mt-8 text-center">
            <button
                onClick={handleBooking}
                className="w-full max-w-md px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition-transform"
            >
                Reservar {selectedSlots.length} {selectedSlots.length > 1 ? 'turnos' : 'turno'}
            </button>
        </div>
      )}

      {/* Modal */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedDate={selectedDate}
        selectedSlots={selectedSlots}
        onBookingSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default TimeSlotFinder;
