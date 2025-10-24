import React, { useState, useEffect, useCallback } from 'react';
import { getPublicCourts, getAvailability } from '../services/courtService';
import { addDays, format, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
import BookingModal from './BookingModal';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const TimeSlotFinder = ({ settings }) => {
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState('');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  const today = startOfToday();
  const maxBookingDays = settings.bookingLeadTime || 7; // Días por defecto si no está configurado

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // --- CORRECCIÓN DE ERROR .map N°1 ---
        // Asumimos que getPublicCourts() también devuelve la respuesta completa de Axios.
        // Extraemos .data de la respuesta.
        const response = await getPublicCourts();
        const data = Array.isArray(response.data) ? response.data : [];
        // --- FIN DE CORRECCIÓN ---

        setCourts(data);
        
        if (data.length > 0) {
          setSelectedCourt(data[0]._id);
        } else {
          setError('No hay canchas disponibles para reservar en este momento.');
        }
      } catch (err) {
        setError(err.message || 'Error al cargar las canchas');
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  const fetchAvailability = useCallback(async () => {
    if (!selectedCourt || !selectedDate) {
      setAvailability([]); 
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // --- CORRECCIÓN DE ERROR .map N°2 (El error que reportaste) ---
      // El error 'a.map is not a function' indica que 'availableData' 
      // en el fix anterior era un objeto (la respuesta de Axios) y no un array.
      // La solución es extraer la propiedad .data de la respuesta.
      const response = await getAvailability(selectedDate, selectedCourt);
      
      // Verificamos que response.data sea un array antes de establecerlo
      const availableData = Array.isArray(response.data) ? response.data : [];
      setAvailability(availableData);
      // --- FIN DE LA CORRECCIÓN ---

    } catch (err) {
      console.error("Error en fetchAvailability:", err);
      // Si la API falla (ej. 404), err.response.data puede ser un objeto de error
      // Nos aseguramos de setear un array vacío.
      setError(err.message || 'Error al cargar la disponibilidad');
      setAvailability([]); 
    } finally {
      setLoading(false);
    }
  }, [selectedCourt, selectedDate]); 

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
    if (slot.isAvailable) {
      setSelectedSlot({
        courtId: selectedCourt,
        courtName: courts.find(c => c._id === selectedCourt)?.name,
        date: selectedDate,
        startTime: slot.time, 
        price: courts.find(c => c._id === selectedCourt)?.price || 0,
      });
      setIsModalOpen(true);
    }
  };

  const selectedCourtDetails = courts.find(c => c._id === selectedCourt);
  const dateForDisplay = new Date(selectedDate + 'T00:00:00');

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      {/* Selector de Cancha */}
      <div className="mb-4">
        <label htmlFor="court" className="block text-sm font-medium text-gray-300 mb-2">
          Selecciona una Cancha
        </label>
        <select
          id="court"
          value={selectedCourt}
          onChange={(e) => setSelectedCourt(e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md shadow-sm text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          disabled={loading || courts.length === 0}
        >
          {/* Este .map ahora es seguro porque 'courts' siempre será un array */}
          {courts.map((court) => (
            <option key={court._id} value={court._id}>
              {court.name} ({court.type})
            </option>
          ))}
        </select>
        {selectedCourtDetails && (
          <p className="text-sm text-gray-400 mt-2">
            Precio por turno: ${selectedCourtDetails.price}
          </p>
        )}
      </div>

      {/* Selector de Fecha */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
          Selecciona una Fecha
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDayShift(-1)}
            disabled={selectedDate === format(today, 'yyyy-MM-dd')}
            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md shadow-sm text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 pr-10"
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <button
            onClick={() => handleDayShift(1)}
            disabled={selectedDate === format(addDays(today, maxBookingDays), 'yyyy-MM-dd')}
            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="text-center text-lg font-semibold text-white mt-3">
          {format(dateForDisplay, 'EEEE, dd \'de\' MMMM', { locale: es })}
        </p>
      </div>

      {/* Grilla de Turnos */}
      {loading ? (
        <InlineLoading text="Buscando turnos disponibles..." />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {/* Este .map (el que causaba el error) ahora es seguro */}
          {availability.map((slot) => (
            <button
              key={slot.time}
              onClick={() => handleSlotClick(slot)}
              disabled={!slot.isAvailable}
              className={`p-3 rounded-md text-center font-semibold transition-colors
                ${
                  slot.isAvailable
                    ? 'bg-green-600 hover:bg-green-500 text-white cursor-pointer'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed line-through'
                }
              `}
            >
              <Clock size={16} className="inline-block mr-1 mb-0.5" />
              {slot.time}
            </button>
          ))}
          {availability.length === 0 && !loading && (
            <p className="text-gray-400 col-span-full text-center">
              No hay turnos para mostrar en esta fecha o cancha.
            </p>
          )}
        </div>
      )}

      {/* Modal de Reserva */}
      {isModalOpen && selectedSlot && (
        <BookingModal
          slot={selectedSlot}
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
