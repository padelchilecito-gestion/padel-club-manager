import React from 'react';
import { format, addMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import { XCircleIcon } from '@heroicons/react/24/solid';

const BookingModal = ({ isOpen, onClose, bookingDetails, user }) => {
  if (!isOpen || !bookingDetails) return null;

  const { court, time, date } = bookingDetails;
  const price = court.price || 50;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" data-testid="booking-modal">
      <div className="bg-dark-secondary p-6 rounded-lg shadow-xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white">
          <XCircleIcon className="h-8 w-8" />
        </button>
        <h2 className="text-2xl font-bold text-primary mb-4">Confirmar Reserva</h2>
        <div className="space-y-3 text-text-primary">
          <p><strong className="text-text-secondary">Cancha:</strong> {court.name}</p>
          <p><strong className="text-text-secondary">Fecha:</strong> {format(new Date(date), "EEEE d 'de' MMMM", { locale: es })}</p>
          <p><strong className="text-text-secondary">Hora:</strong> {format(time, 'HH:mm')} - {format(addMinutes(time, 30), 'HH:mm')}</p>
          <p className="text-2xl font-bold text-primary mt-4"><strong className="text-text-secondary">Precio:</strong> ${price.toFixed(2)}</p>
        </div>
        <div className="mt-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            // onClick={onConfirm} // This will be handled by the parent component
            className="px-6 py-2 bg-secondary hover:bg-opacity-80 text-white font-bold rounded-md transition-colors"
          >
            Confirmar y Pagar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;