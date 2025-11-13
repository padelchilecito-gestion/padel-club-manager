import React, { useState, useEffect } from 'react';
import { courtService } from '../../services/courtService';
import { bookingService } from '../../services/bookingService';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime, zonedTimeToUtc } from 'date-fns-tz';

const BookingFormModal = ({ booking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    courtId: '',
    date: '',
    time: '',
    duration: '60', // Duración en minutos
    price: '',
    paymentMethod: 'Efectivo',
    isPaid: false,
  });
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!booking;
  const timeZone = 'America/Argentina/Buenos_Aires';

  useEffect(() => {
    const fetchCourts = async () => {
      const courtsData = await courtService.getAllCourts();
      setCourts(courtsData);
      if (courtsData.length > 0 && !isEditMode) {
        setFormData(prev => ({ ...prev, courtId: courtsData[0]._id }));
      }
    };
    fetchCourts();

    if (isEditMode) {
      const zonedStartTime = utcToZonedTime(new Date(booking.startTime), timeZone);
      const durationInMinutes = (new Date(booking.endTime) - new Date(booking.startTime)) / 60000;

      setFormData({
        name: booking.user.name,
        phone: booking.user.phone,
        courtId: booking.court._id,
        date: format(zonedStartTime, 'yyyy-MM-dd'),
        time: format(zonedStartTime, 'HH:mm'),
        duration: String(durationInMinutes),
        price: booking.price,
        paymentMethod: booking.paymentMethod,
        isPaid: booking.isPaid,
      });
    }
  }, [booking, isEditMode]);

  // --- NUEVO EFECTO ---
  // Autocalcular el precio si no estamos en modo edición
  useEffect(() => {
    if (!isEditMode && formData.courtId && formData.duration && courts.length > 0) {
      const court = courts.find(c => c._id === formData.courtId);
      if (court) {
        const pricePerMinute = court.pricePerHour / 60;
        const calculatedPrice = pricePerMinute * parseInt(formData.duration, 10);
        
        setFormData(prev => ({
          ...prev,
          price: calculatedPrice.toFixed(2) // Aseguramos 2 decimales
        }));
      }
    }
  }, [formData.courtId, formData.duration, courts, isEditMode]);
  // --------------------

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'paymentMethod') {
      // Si cambia el método de pago, decidimos el estado de 'isPaid'
      const newIsPaid = value !== 'Efectivo'; // Pagado para todo excepto Efectivo
      setFormData(prev => ({
        ...prev,
        paymentMethod: value,
        isPaid: newIsPaid
      }));
    } else {
      // Lógica original
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const [hour, minute] = formData.time.split(':').map(Number);
      const zonedStart = zonedTimeToUtc(`${formData.date}T${formData.time}:00`, timeZone);
      const zonedEnd = new Date(zonedStart.getTime() + formData.duration * 60000);

      const bookingData = {
        courtId: formData.courtId,
        user: { name: formData.name, phone: formData.phone },
        startTime: zonedStart.toISOString(),
        endTime: zonedEnd.toISOString(),
        price: Number(formData.price),
        paymentMethod: formData.paymentMethod,
        isPaid: formData.isPaid,
        status: 'Confirmed'
      };

      if (isEditMode) {
        await bookingService.updateBooking(booking._id, bookingData);
      } else {
        await bookingService.createBooking(bookingData);
      }
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al guardar el turno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-primary mb-6">{isEditMode ? 'Editar Turno' : 'Añadir Turno'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Nombre del Cliente</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-text-secondary">Teléfono</label>
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div>
            <label htmlFor="courtId" className="block text-sm font-medium text-text-secondary">Cancha</label>
            <select name="courtId" value={formData.courtId} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
              {courts.map(court => <option key={court._id} value={court._id}>{court.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-text-secondary">Fecha</label>
              <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium text-text-secondary">Hora</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} required step="1800" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
            </div>
          </div>
           <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-text-secondary">Duración (minutos)</label>
              <select name="duration" value={formData.duration} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
                  <option value="30">30 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                  <option value="120">120 min</option>
              </select>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-text-secondary">Precio</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                required 
                min="0" 
                readOnly={!isEditMode}
                className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600 read-only:opacity-70 read-only:bg-gray-700" 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-text-secondary">Método de Pago</label>
              <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
                <option>Efectivo</option>
                <option>Mercado Pago</option>
                <option>Transferencia</option>
                <option>QR</option>
                <option>Otro</option>
              </select>
            </div>
            <div className="flex items-center pt-6">
              <input type="checkbox" name="isPaid" checked={formData.isPaid} onChange={handleChange} className="h-4 w-4 rounded border-gray-600 bg-dark-primary text-primary focus:ring-primary" />
              <label htmlFor="isPaid" className="ml-2 text-sm text-text-secondary">¿Está Pagado?</label>
            </div>
          </div>
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingFormModal;
