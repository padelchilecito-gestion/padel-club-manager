import React, { useState, useEffect } from 'react';
import { courtService } from '../../services/courtService';
import { recurringBookingService } from '../../services/recurringBookingService';
import { format } from 'date-fns';

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const RecurringBookingFormModal = ({ booking, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    courtId: '',
    dayOfWeek: '1', // Lunes por defecto
    startTime: '20:00',
    duration: '60',
    price: '',
    paymentMethod: 'Efectivo',
    isPaid: false,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    notes: '',
  });
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!booking;

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
      setFormData({
        name: booking.user.name,
        phone: booking.user.phone,
        email: booking.user.email || '',
        courtId: booking.court._id,
        dayOfWeek: String(booking.dayOfWeek),
        startTime: booking.startTime,
        duration: String(booking.duration),
        price: booking.price,
        paymentMethod: booking.paymentMethod,
        isPaid: booking.isPaid,
        startDate: format(new Date(booking.startDate), 'yyyy-MM-dd'),
        endDate: booking.endDate ? format(new Date(booking.endDate), 'yyyy-MM-dd') : '',
        notes: booking.notes || '',
      });
    }
  }, [booking, isEditMode]);

  // Autocalcular precio
  useEffect(() => {
    if (!isEditMode && formData.courtId && formData.duration && courts.length > 0) {
      const court = courts.find(c => c._id === formData.courtId);
      if (court) {
        const pricePerMinute = court.pricePerHour / 60;
        const calculatedPrice = pricePerMinute * parseInt(formData.duration, 10);
        setFormData(prev => ({ ...prev, price: calculatedPrice.toFixed(2) }));
      }
    }
  }, [formData.courtId, formData.duration, courts, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'paymentMethod') {
      setFormData(prev => ({
        ...prev,
        paymentMethod: value,
        isPaid: value !== 'Efectivo',
      }));
    } else {
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
      const data = {
        courtId: formData.courtId,
        user: {
          name: formData.name,
          phone: formData.phone,
          email: formData.email,
        },
        dayOfWeek: parseInt(formData.dayOfWeek),
        startTime: formData.startTime,
        duration: parseInt(formData.duration),
        price: parseFloat(formData.price),
        paymentMethod: formData.paymentMethod,
        isPaid: formData.isPaid,
        startDate: formData.startDate,
        endDate: formData.endDate || null,
        notes: formData.notes,
      };

      if (isEditMode) {
        await recurringBookingService.updateRecurringBooking(booking._id, data);
      } else {
        await recurringBookingService.createRecurringBooking(data);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar la reserva recurrente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-primary mb-6">
          {isEditMode ? 'Editar Turno Fijo' : 'Añadir Turno Fijo'}
        </h2>
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
            <label htmlFor="email" className="block text-sm font-medium text-text-secondary">Email (Opcional)</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div>
            <label htmlFor="courtId" className="block text-sm font-medium text-text-secondary">Cancha</label>
            <select name="courtId" value={formData.courtId} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
              <option value="">Seleccione una cancha...</option>
              {courts.map(court => <option key={court._id} value={court._id}>{court.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-text-secondary">Día de la Semana</label>
              <select name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
                {days.map((day, index) => <option key={index} value={index}>{day}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-text-secondary">Hora</label>
              <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required step="1800" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-text-secondary">Duración (min)</label>
              <select name="duration" value={formData.duration} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
                <option value="30">30 min</option>
                <option value="60">60 min</option>
                <option value="90">90 min</option>
                <option value="120">120 min</option>
              </select>
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-text-secondary">Precio</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} required min="0" readOnly={!isEditMode} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600 read-only:opacity-70 read-only:bg-gray-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-text-secondary">Desde</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-text-secondary">Hasta (opcional)</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
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
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-text-secondary">Notas (Opcional)</label>
            <textarea name="notes" rows="2" value={formData.notes} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Turno Fijo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecurringBookingFormModal;
