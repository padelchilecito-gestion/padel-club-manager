import React, { useState } from 'react';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { bookingService } from '../services/bookingService'; // Importar el servicio
import { InlineLoading, ErrorMessage } from './ui/Feedback';

// Recibe 'slots' (array) y 'settings'
const BookingModal = ({ slots, settings, onClose, onBookingSuccess }) => {
  if (!slots || slots.length === 0) return null;

  // --- Punto 3: Formulario de Cliente ---
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    phone: '',
  });
  
  // --- Punto 4: Opciones de Pago ---
  const [paymentMethod, setPaymentMethod] = useState('Efectivo'); 
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Punto 5: Resumen y Totalización ---
  const sortedSlots = slots.sort((a, b) => a.startTime.localeCompare(b.startTime));
  const firstSlot = sortedSlots[0];
  const lastSlot = sortedSlots[sortedSlots.length - 1];
  
  const totalSlots = slots.length;
  const totalPrice = slots.reduce((total, slot) => total + slot.price, 0);
  const totalDuration = totalSlots * (settings.slotDuration || 30);

  // Calcular hora de inicio y fin
  const dateObj = new Date(firstSlot.date + 'T00:00:00');
  const startTimeStr = firstSlot.startTime;
  const lastSlotTime = new Date(`1970-01-01T${lastSlot.startTime}`);
  const endTimeObj = addMinutes(lastSlotTime, settings.slotDuration || 30);
  const endTimeStr = format(endTimeObj, 'HH:mm');

  // Enviar reserva
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.lastName || !formData.phone) {
      setError('Por favor completa todos tus datos.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const bookingData = {
        slots: slots, // Array de slots seleccionados
        user: formData, // Datos del cliente
        paymentMethod: paymentMethod, // Forma de pago
      };

      // Llamar al 'createBooking' modificado del backend
      await bookingService.createBooking(bookingData); 
      
      setLoading(false);
      onBookingSuccess(); // Cierra el modal y refresca
      
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Error al crear la reserva.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <XMarkIcon className="h-7 w-7" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4">Confirmar Reserva</h2>
        
        {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

        <form onSubmit={handleSubmit}>
          {/* --- Punto 5: Resumen --- */}
          <div className="bg-gray-900 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Resumen de tu Reserva</h3>
            <p className="text-gray-300">
              <strong className="text-gray-400">Fecha:</strong> {format(dateObj, "EEEE, dd 'de' MMMM", { locale: es })}
            </p>
            <p className="text-gray-300">
              <strong className="text-gray-400">Horario:</strong> {startTimeStr} a {endTimeStr} ({totalDuration} min)
            </p>
            <p className="text-gray-300">
              <strong className="text-gray-400">Cancha:</strong> {firstSlot.courtName} (Asignada)
            </p>
            <p className="text-2xl font-bold text-white mt-3">
              <strong className="text-gray-400">Total:</strong> ${totalPrice}
            </p>
          </div>

          {/* --- Punto 3: Formulario Cliente --- */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Tus Datos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleInputChange} required className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-300">Apellido</label>
                <input type="text" name="lastName" id="lastName" value={formData.lastName} onChange={handleInputChange} required className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white" />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Teléfono (WhatsApp)</label>
              <input type="tel" name="phone" id="phone" value={formData.phone} onChange={handleInputChange} required placeholder="Ej: 3825123456" className="w-full mt-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-md text-white" />
            </div>
          </div>

          {/* --- Punto 4: Opciones de Pago --- */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-indigo-400 mb-3">Forma de Pago</h3>
            <div className="flex gap-4">
              <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer ${paymentMethod === 'Efectivo' ? 'border-indigo-500 bg-indigo-900' : 'border-gray-700 bg-gray-900'}`}>
                <input type="radio" name="paymentMethod" value="Efectivo" checked={paymentMethod === 'Efectivo'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                <span className="text-white font-bold">Efectivo en el Club</span>
              </label>
              <label className={`flex-1 p-4 rounded-lg border-2 cursor-pointer ${paymentMethod === 'Mercado Pago' ? 'border-indigo-500 bg-indigo-900' : 'border-gray-700 bg-gray-900'}`}>
                <input type="radio" name="paymentMethod" value="Mercado Pago" checked={paymentMethod === 'Mercado Pago'} onChange={(e) => setPaymentMethod(e.target.value)} className="hidden" />
                <span className="text-white font-bold">Mercado Pago</span>
              </label>
            </div>
          </div>

          {/* Acciones */}
          <div className="mt-6 flex justify-end gap-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? <InlineLoading text="Confirmando..." /> : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
