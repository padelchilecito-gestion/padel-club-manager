import React, { useState } from 'react';
import { Payment } from '@mercadopago/sdk-react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/solid';
import { bookingService } from '../services/bookingService';

/**
 * Modal que renderiza el "Payment Brick" de Mercado Pago.
 * Se encarga de manejar el envío del pago y la creación de la reserva.
 */
const PaymentBrickModal = ({ preferenceId, bookingData, onClose, onSuccess }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Esta función es la que llama el Brick CUANDO el pago está listo
  const handlePaymentSubmit = async (paymentData) => {
    setIsLoading(true);
    setError('');

    try {
      // 1. El pago ya se procesó en el frontend.
      // 2. Ahora, creamos la reserva en nuestro backend (usando la ruta pública)
      //    con los datos que guardamos.
      const createdBooking = await bookingService.createPublicBooking({
        ...bookingData,
        isPaid: true, // Marcamos como pagada
        paymentMethod: 'Mercado Pago', // Asignamos el método
      });

      // 3. Actualizamos la reserva con el ID de pago de MP (para idempotencia)
      await bookingService.updateBookingStatus(createdBooking._id, {
        paymentId: paymentData.id,
      });

      // 4. ¡Éxito! Cerramos el modal y refrescamos la app.
      onSuccess();

    } catch (err) {
      // Si falla la creación de la reserva (ej. alguien reservó 1 seg antes)
      setError(err.message || 'Error al guardar la reserva. El pago fue procesado.');
      console.error(err);
      // Aquí se debería implementar lógica de reembolso, ya que el pago se hizo.
      // Por ahora, solo mostramos el error.
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg relative">
        
        {/* Botón de Cerrar */}
        {!isLoading && (
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-white"
          >
            <XMarkIcon className="h-8 w-8" />
          </button>
        )}

        {/* Contenido del Modal */}
        <h2 className="text-2xl font-bold mb-6 text-primary text-center">Finaliza tu pago</h2>

        {/*
          El Payment Brick se renderiza aquí.
          Toma el control del formulario y del botón de pago.
        */}
        <Payment
          initialization={{
            amount: bookingData.totalPrice, // El monto total
            preferenceId: preferenceId,     // El ID de preferencia
          }}
          customization={{
            visual: {
              style: {
                theme: 'dark', // Usa el tema oscuro de MP
              },
            },
            paymentMethods: {
              // Habilitamos los métodos de bajo costo primero
              ticket: "all",
              bankTransfer: "all",
              atm: "all",
              creditCard: "all",
              debitCard: "all",
              mercadoPago: "all", // Dinero en cuenta
            },
          }}
          // Se llama cuando el pago se completa
          onSubmit={handlePaymentSubmit}
          onError={(err) => {
            console.error("Error del Payment Brick:", err);
            setError("Error de Mercado Pago. Revisa los datos de la tarjeta.");
          }}
          onReady={() => setIsLoading(false)} // El brick está listo para usarse
        />

        {/* Mostramos un spinner mientras paga */}
        {isLoading && (
          <div className="absolute inset-0 bg-dark-secondary bg-opacity-90 flex flex-col justify-center items-center">
            <ArrowPathIcon className="h-12 w-12 text-primary animate-spin" />
            <p className="text-text-primary mt-4">Procesando pago, no cierres esta ventana...</p>
          </div>
        )}

        {error && <p className="text-danger text-center text-sm mt-4">{error}</p>}

      </div>
    </div>
  );
};

export default PaymentBrickModal;
