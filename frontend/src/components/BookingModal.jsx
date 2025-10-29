// frontend/src/components/BookingModal.jsx
import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const BookingModal = ({ 
  isOpen, 
  onClose, 
  courtId, 
  date, 
  time, 
  price: initialPrice,
  userPhone, 
  userName, 
  userLastName,
  onSubmit, 
  currency = '$', 
  slotDuration, 
}) => {
  const [clientName, setClientName] = useState(userName || '');
  const [clientLastName, setClientLastName] = useState(userLastName || '');
  const [clientPhone, setClientPhone] = useState(userPhone || '');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' o 'mercadopago'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Calcula un precio estimado si no se proporciona (ej. $1000 por hora)
  // ESTO DEBERÍA VENIR DE LA CONFIGURACIÓN DEL CLUB O DEL BACKEND
  const basePricePerHour = 1000; // PRECIO FIJO TEMPORAL, AJUSTAR CON SETTINGS REALES
  const calculatedPrice = initialPrice || (slotDuration ? (slotDuration / 60 * basePricePerHour) : 0);
  const displayPrice = calculatedPrice > 0 ? `${currency} ${calculatedPrice.toFixed(2)}` : 'A Confirmar';

  useEffect(() => {
    if (isOpen) {
      // Si el usuario está logueado, rellenamos con sus datos, si no, los dejamos vacíos
      setClientName(userName || '');
      setClientLastName(userLastName || '');
      setClientPhone(userPhone || '');
      setPaymentMethod('cash'); 
      setError(null);
    }
  }, [isOpen, userName, userLastName, userPhone]); // Dependencias para resetear al abrir

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!clientName || !clientPhone) {
      setError('El nombre y el teléfono del cliente son obligatorios para la reserva.');
      setLoading(false);
      return;
    }

    try {
      const bookingData = {
        courtId: courtId, // Podría ser null, el backend decide
        startTime: `${date}T${time}:00`, // Formato ISO para el backend
        duration: slotDuration, // Duración del turno en minutos
        clientName,
        clientLastName,
        clientPhone,
        paymentMethod,
        price: calculatedPrice, // Enviar el precio calculado
      };

      // Llamamos a la función onSubmit que viene del padre (SimpleTimeSlotFinder)
      // Esta función manejará la llamada al servicio de booking y la lógica de redirección/WhatsApp
      await onSubmit(bookingData);

    } catch (err) {
      console.error("Error en el modal al enviar reserva:", err);
      // El toast ya lo muestra la función onSubmit del padre
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Confirmar Reserva</h2>
        <p className="text-gray-300 mb-4">
          Cancha: {courtId ? 'Cancha ' + courtId : 'Asignación automática'}
          <br />
          Fecha: {date}
          <br />
          Hora: {time}
          <br />
          Precio: <span className="font-semibold text-green-400">{displayPrice}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="clientName" className="block text-gray-300 text-sm font-bold mb-2">
              Nombre:
            </label>
            <input
              type="text"
              id="clientName"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required // Obligatorio siempre
              disabled={loading}
            />
          </div>
          <div className="mb-4">
            <label htmlFor="clientLastName" className="block text-gray-300 text-sm font-bold mb-2">
              Apellido:
            </label>
            <input
              type="text"
              id="clientLastName"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={clientLastName}
              onChange={(e) => setClientLastName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="clientPhone" className="block text-gray-300 text-sm font-bold mb-2">
              Teléfono:
            </label>
            <input
              type="tel"
              id="clientPhone"
              className="shadow appearance-none border border-gray-700 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:shadow-outline bg-gray-700"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              required // Obligatorio siempre
              disabled={loading}
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-300 text-sm font-bold mb-2">
              Método de Pago:
            </label>
            <div className="flex items-center space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-purple-600 focus:ring-purple-500"
                  name="paymentMethod"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={() => setPaymentMethod('cash')}
                  disabled={loading}
                />
                <span className="ml-2 text-white">Efectivo</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-purple-600 focus:ring-purple-500"
                  name="paymentMethod"
                  value="mercadopago"
                  checked={paymentMethod === 'mercadopago'}
                  onChange={() => setPaymentMethod('mercadopago')}
                  disabled={loading}
                />
                <span className="ml-2 text-white">Mercado Pago</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition-colors"
              disabled={loading}
            >
              {loading ? 'Procesando...' : 'Confirmar Reserva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
