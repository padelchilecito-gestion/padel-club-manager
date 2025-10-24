import React, { useState, useEffect, useCallback } from 'react';
import { getPublicCourts, getAvailability } from '../services/courtService';
import { addDays, format, isBefore, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { InlineLoading, ErrorMessage } from './ui/Feedback';
// AHORA ESTE MODAL SÍ VA A FUNCIONAR
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
  
  // 'selectedSlot' ahora guardará el objeto 'bookingDetails' que el modal espera
  const [selectedSlot, setSelectedSlot] = useState(null); 

  const today = startOfToday();
  const maxBookingDays = settings.bookingLeadTime || 7; 

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPublicCourts(); 
        
        if (data && data.length > 0) {
          setCourts(data); 
          setSelectedCourt(data[0]._id);
        } else {
          setCourts([]); 
          setError('No hay canchas disponibles para reservar en este momento.');
        }
      } catch (err) {
        setCourts([]);
        setError(err.message || 'Error al cargar las canchas');
      } finally {
        // Dejamos que fetchAvailability maneje el fin de la carga
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
      const availableData = await getAvailability(selectedDate, selectedCourt);
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

  // --- CORRECCIÓN DE COMPATIBILIDAD ---
  const handleSlotClick = (slot) => {
    // slot es { startTime: "07:30", isAvailable: true }
    if (slot.isAvailable) {
      const courtDetails = courts.find(c => c._id === selectedCourt);
      
      // BookingModal.jsx espera un objeto anidado 'bookingDetails'
      // Lo construimos aquí
      const bookingDetailsForModal = {
        court: courtDetails, // Pasamos el objeto de cancha completo
        date: selectedDate + 'T00:00:00', // Pasamos la fecha (con T00 para que 'date-fns' la tome bien)
        
        // BookingModal.jsx espera 'time' (no 'startTime')
        // También espera que 'time' sea un objeto Date, no un string
        // (lo deducimos por el 'format(time, 'HH:mm')' que usa el modal)
        time: new Date(`${selectedDate}T${slot.startTime}`),
      };

      console.log('--- Datos construidos para BookingModal.jsx ---');
      console.log(bookingDetailsForModal);

      // Guardamos este objeto para pasárselo al modal
      setSelectedSlot(bookingDetailsForModal);
      setIsModalOpen(true);
    }
  };
  // --- FIN DE CORRECCIÓN ---

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
            Precio por turno: ${selectedCourtDetails.pricePerHour}
          </p>
        )}
      </div>

      {/* Selector de Fecha (Sin cambios) */}
      <div className="mb-6">
        <label htmlFor="date" className="block text-sm font-medium text-gray-300 mb-2">
          Selecciona una Fecha
        </label>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDayShift(-1)}
            disabled={loading || selectedDate === format(today, 'yyyy-MM-dd')}
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
              disabled={loading}
            />
            <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          </div>
          <button
            onClick={() => handleDayShift(1)}
            disabled={loading || selectedDate === format(addDays(today, maxBookingDays), 'yyyy-MM-dd')}
            className="p-2 rounded-md bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <p className="text-center text-lg font-semibold text-white mt-3">
          {format(dateForDisplay, 'EEEE, dd \'de\' MMMM', { locale: es })}
        </p>
      </div>

      {/* Grilla de Turnos (Sin cambios) */}
      {loading ? (
        <InlineLoading text="Buscando turnos disponibles..." />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {availability.map((slot) => (
            <button
              key={slot.startTime} 
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
              {slot.startTime}
            </button>
          ))}
          {availability.length === 0 && !loading && (
            <p className="text-gray-400 col-span-full text-center">
              No hay turnos para mostrar en esta fecha o cancha.
            </p>
          )}
        </div>
      )}

      {/* --- CORRECCIÓN DE LLAMADA AL MODAL --- */}
      {/* El modal (BookingModal.jsx) espera las props 'isOpen', 'bookingDetails', y 'onClose'.
        Ahora se las pasamos con esos nombres.
      */}
      <BookingModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSlot(null);
        }}
        bookingDetails={selectedSlot} // Le pasamos el objeto que construimos
        
        // El modal también espera 'user', pero no lo tenemos. 
        // Pasamos null o un objeto vacío.
        user={null} 
        
        // El modal no espera onBookingSuccess, así que no lo pasamos
      />
      {/* --- FIN DE CORRECCIÓN --- */}
    </div>
  );
};

export default TimeSlotFinder;
