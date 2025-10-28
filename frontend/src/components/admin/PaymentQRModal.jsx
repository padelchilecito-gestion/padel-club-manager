import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, CreditCardIcon } from '@heroicons/react/24/solid'; // Cambiamos ícono
import { paymentService } from '../../services/paymentService'; // Actualizado
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
// Ya no necesitamos qrcode.react
// import { QRCodeSVG } from 'qrcode.react'; 

const PaymentQRModal = ({ booking, onClose }) => {
  // --- CAMBIO: Guardaremos el init_point ---
  const [initPoint, setInitPoint] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' | 'success'

  // 1. Efecto para generar el LINK de pago
  useEffect(() => {
    if (!booking) return;

    const generateLink = async () => {
      try {
        setLoading(true);
        setError(null);
        // Llamamos a la función renombrada del servicio
        const data = await paymentService.generatePaymentLink(booking._id);
        if (data.init_point) {
           setInitPoint(data.init_point); 
        } else {
            throw new Error('No se recibió el link de pago.');
        }
      } catch (err) {
        setError(err.message || 'No se pudo generar el link de pago.');
      } finally {
        setLoading(false);
      }
    };

    generateLink();
  }, [booking]);

  // 2. Efecto para escuchar la confirmación (SIN CAMBIOS)
  useEffect(() => {
    socket.connect();
    const handleBookingUpdate = (updatedBooking) => {
      if (updatedBooking._id === booking._id && updatedBooking.isPaid) {
        setPaymentStatus('success');
        setTimeout(() => { onClose(true); }, 2000);
      }
    };
    socket.on('booking_update', handleBookingUpdate);
    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect();
    };
  }, [booking, onClose]);

  // --- Función para abrir el link en nueva pestaña ---
  const handlePayClick = () => {
    if (initPoint) {
      window.open(initPoint, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm relative text-white">
        <button onClick={() => onClose(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <XMarkIcon className="h-7 w-7" />
        </button>
        {/* Cambiamos el título */}
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Cobrar con Mercado Pago</h2>
        
        <div className="p-4 bg-gray-900 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
          {loading && <InlineLoading text="Generando link de pago..." />}
          {error && <ErrorMessage message={error} />}
          
          {/* --- CAMBIO: Mostrar botón en lugar de QR --- */}
          {initPoint && paymentStatus === 'pending' && (
            <div className='text-center'>
              <p className="text-lg font-semibold">Reserva para:</p>
              <p className='text-md mb-2'>{`${booking.user.name} ${booking.user.lastName || ''}`}</p>
              <p className="text-lg font-semibold">Monto a pagar:</p>
              <p className="text-3xl font-bold text-secondary mb-6">${booking.price}</p>
              
              <button
                onClick={handlePayClick}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-md transition-colors flex items-center justify-center text-lg"
              >
                <CreditCardIcon className="h-6 w-6 mr-2" />
                Ir a Pagar con Mercado Pago
              </button>
              
              <p className="text-sm text-gray-400 mt-4">Se abrirá una nueva pestaña.</p>
              <p className="text-md text-yellow-dark mt-2">Esperando confirmación de pago aquí...</p>
            </div>
          )}

          {paymentStatus === 'success' && (
             <div className="flex flex-col items-center justify-center text-center">
                <CheckCircleIcon className="h-20 w-20 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-green-400">¡Pago Recibido!</h3>
                <p className="text-gray-300">La reserva ha sido actualizada.</p>
             </div>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default PaymentQRModal;
