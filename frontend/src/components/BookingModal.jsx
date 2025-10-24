import React, { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { XCircleIcon, UserIcon, PhoneIcon, CreditCardIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import { bookingService } from '../services/bookingService';
import { InlineLoading, ErrorMessage } from './ui/Feedback';

const BookingModal = ({ isOpen, onClose, selectedDate, selectedSlots, onBookingSuccess }) => {
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const pricePerHour = 20; // Hardcoded as court object is not available here
  const totalPrice = useMemo(() => {
    const durationHours = selectedSlots.length * 0.5; // Each slot is 30 mins
    return durationHours * pricePerHour;
  }, [selectedSlots, pricePerHour]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userName || !userPhone) {
      setError('Nombre y teléfono son obligatorios.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await bookingService.createBooking({
        date: selectedDate,
        slots: selectedSlots,
        userName,
        userPhone,
        paymentMethod,
      });
      onBookingSuccess();
    } catch (err) {
      setError(err.message || 'Error al crear la reserva.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-lg relative text-white">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <XCircleIcon className="h-8 w-8" />
        </button>
        <h2 className="text-3xl font-bold text-indigo-400 mb-6">Confirmar tu Reserva</h2>

        {/* Booking Summary */}
        <div className="bg-gray-700/50 p-4 rounded-md mb-6">
          <h3 className="text-xl font-semibold mb-3 text-gray-200">Resumen</h3>
          <p><strong>Fecha:</strong> {format(new Date(selectedDate + 'T00:00:00'), "EEEE, dd 'de' MMMM", { locale: es })}</p>
          <p><strong>Turnos:</strong> {selectedSlots.join(', ')}</p>
          <p><strong>Duración:</strong> {selectedSlots.length * 0.5} horas</p>
          <p className="text-2xl font-bold text-indigo-400 mt-2">Total: ${totalPrice.toFixed(2)}</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* User Details */}
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre y Apellido</label>
            <div className="relative">
              <UserIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
              <input type="text" id="name" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full pl-10 p-2 bg-gray-900 border border-gray-700 rounded-md" required/>
            </div>
          </div>
          <div className="mb-6">
            <label htmlFor="phone" className="block text-sm font-medium mb-1">Teléfono</label>
            <div className="relative">
              <PhoneIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
              <input type="tel" id="phone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} className="w-full pl-10 p-2 bg-gray-900 border border-gray-700 rounded-md" required/>
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Forma de Pago</h3>
            <div className="flex gap-4">
              <button type="button" onClick={() => setPaymentMethod('Efectivo')} className={`flex-1 p-3 rounded-md flex items-center justify-center gap-2 transition-all ${paymentMethod === 'Efectivo' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                <CurrencyDollarIcon className="h-6 w-6"/> Efectivo
              </button>
              <button type="button" onClick={() => setPaymentMethod('Mercado Pago')} className={`flex-1 p-3 rounded-md flex items-center justify-center gap-2 transition-all ${paymentMethod === 'Mercado Pago' ? 'bg-indigo-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
                <CreditCardIcon className="h-6 w-6"/> Mercado Pago
              </button>
            </div>
          </div>

          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

          <div className="mt-6 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 font-bold rounded-md" disabled={loading}>Cancelar</button>
            <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-500 font-bold rounded-md flex items-center" disabled={loading}>
              {loading ? <InlineLoading text="Confirmando..." /> : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
