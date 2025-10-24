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
  const maxBookingDays = settings.bookingLeadTime || 7; 

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // (Esto ya estaba corregido)
        const data = await getPublicCourts(); 
        
        if (data.length > 0) {
          setCourts(data); // courts es un array
          setSelectedCourt(data[0]._id);
        } else {
          setCourts([]); // Asegurarse de que sea un array vacío
          setError('No hay canchas disponibles para reservar en este momento.');
        }
      } catch (err) {
        setCourts([]);
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
      
      // (Esto ya estaba corregido)
      const availableData = await getAvailability(selectedDate, selectedCourt);
      
      // Nos aseguramos de que sea un array
      setAvailability(Array.isArray(availableData) ? availableData : []);

    } catch (err) {
      console.error("Error en fetchAvailability:", err);
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

  // --- FUNCIÓN DE DEBUG ---
  const handleSlotClick = (slot) => {
    console.log('--- 1. Clic en Slot ---');
    console.log('Slot recibido:', slot);

    if (slot.isAvailable) {
      const courtDetails = courts.find(c => c._id === selectedCourt);
      
      const newSlotDetails = {
        courtId: selectedCourt,
        courtName: courtDetails ? courtDetails.name : 'Cancha no encontrada',
        date: selectedDate,
        startTime: slot.time,
        price: courtDetails ? courtDetails.price : 0,
      };

      console.log('--- 2. Datos para el Modal ---');
      console.log('Datos a establecer:', newSlotDetails);
      console.log('Array de canchas (para verificar):', courts);
      console.log('ID de cancha seleccionada:', selectedCourt);

      setSelectedSlot(newSlotDetails);
      setIsModalOpen(true);
      
      console.log('--- 3. Estado de Modal ---');
      console.log('Modal seteado a: Abierto');
      
    } else {
      console.warn('Clic en slot NO disponible (esto no debería pasar si está deshabilitado)');
    }
  };
  // --- FIN DE FUNCIÓN DE DEBUG ---

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
        {/* ... (código de fecha sin cambios) ... */}
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
          {/* Este .map ahora funciona */}
          {availability.map((slot) => (
            <button
              key={slot.time}
              onClick={() => handleSlotClick(slot)} // Llama a la función de debug
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
      {/* Esta condición {isModalOpen && selectedSlot && ...} es la que 
          probablemente está fallando. Los logs nos dirán por qué. */}
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
