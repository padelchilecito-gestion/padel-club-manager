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

  // Carga las canchas (courts) una sola vez al montar el componente
  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Asumimos que courtService.js ya está corregido y esto devuelve un array
        const data = await getPublicCourts(); 
        
        if (data && data.length > 0) {
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
        // No ponemos setLoading(false) aquí, dejamos que fetchAvailability lo haga
      }
    };
    fetchCourts();
  }, []);

  // Carga la disponibilidad (availability)
  const fetchAvailability = useCallback(async () => {
    // No hacer nada si la cancha seleccionada aún no está cargada
    if (!selectedCourt || !selectedDate) {
      setAvailability([]); 
      return;
    }
    try {
      setLoading(true); // Inicia la carga aquí
      setError(null);
      
      // Asumimos que courtService.js ya está corregido y esto devuelve un array
      const availableData = await getAvailability(selectedDate, selectedCourt);
      
      // Nos aseguramos de que sea un array
      setAvailability(Array.isArray(availableData) ? availableData : []);

    } catch (err) {
      console.error("Error en fetchAvailability:", err);
      setError(err.message || 'Error al cargar la disponibilidad');
      setAvailability([]); 
    } finally {
      setLoading(false); // Termina la carga aquí
    }
  }, [selectedCourt, selectedDate]); // Depende de la cancha y la fecha

  // Llama a fetchAvailability cuando 'fetchAvailability' cambie (o sea, cuando cambien sus dependencias)
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

  // --- FUNCIÓN DE DEBUG (INCLUIDA) ---
  const handleSlotClick = (slot) => {
    console.log('--- 1. Clic en Slot ---');
    console.log('Slot recibido:', slot); // Debería ser { startTime: "HH:MM", isAvailable: true }

    if (slot.isAvailable) {
      // Busca la info de la cancha en el estado 'courts'
      const courtDetails = courts.find(c => c._id === selectedCourt);
      
      console.log('--- 2. Detalles de Cancha ---');
      console.log('Detalles encontrados:', courtDetails); // Debería mostrar el objeto de la cancha

      const newSlotDetails = {
        courtId: selectedCourt,
        courtName: courtDetails ? courtDetails.name : 'Cancha no encontrada',
        date: selectedDate,
        
        // Corrección clave: la propiedad es "startTime"
        startTime: slot.startTime, 
        
        // Corrección clave: la propiedad es "pricePerHour"
        price: courtDetails ? courtDetails.pricePerHour : 0, 
      };

      console.log('--- 3. Datos para el Modal ---');
      console.log('Datos a establecer:', newSlotDetails); // Verificar que startTime y price tengan valores

      setSelectedSlot(newSlotDetails);
      setIsModalOpen(true);
      
      console.log('--- 4. Modal Abierto ---');
      
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
          // Deshabilitado si no hay canchas o si está cargando disponibilidad
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
            {/* Corrección clave: Mostrar 'pricePerHour' */}
            Precio por turno: ${selectedCourtDetails.pricePerHour}
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

      {/* Grilla de Turnos */}
      {loading ? (
        <InlineLoading text="Buscando turnos disponibles..." />
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {availability.map((slot) => (
            <button
              key={slot.startTime} // Usar startTime como key
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
              {slot.startTime} {/* Mostrar startTime */}
            </button>
          ))}
          {/* Mensaje de 'no hay turnos' */}
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
            fetchAvailability(); // Refresca la lista de turnos
          }}
        />
      )}
    </div>
  );
};

export default TimeSlotFinder;
