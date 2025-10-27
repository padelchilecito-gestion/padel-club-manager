import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { paymentService } from '../../services/paymentService'; // El servicio que creamos
import socket from '../../services/socketService'; // Para escuchar la confirmación
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
import { QRCodeSVG } from 'qrcode.react'; // La librería que "instalaste" en Paso 1

const PaymentQRModal = ({ booking, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' | 'success'

  // 1. Efecto para generar el QR al abrir el modal
  useEffect(() => {
    if (!booking) return;

    const generate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.generateQR(booking._id);
        setQrData(data.qr_data);
      } catch (err) {
        setError(err.message || 'No se pudo generar el QR.');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [booking]);

  // 2. Efecto para escuchar la confirmación de pago por Socket.IO
  useEffect(() => {
    socket.connect();

    const handleBookingUpdate = (updatedBooking) => {
      // Chequear si la actualización es de ESTA reserva y si FUE pagada
      if (updatedBooking._id === booking._id && updatedBooking.isPaid) {
        setPaymentStatus('success');
        
        // Esperar 2 segundos y cerrar el modal
        setTimeout(() => {
          onClose(true); // Enviar 'true' para indicar que se pagó
        }, 2000);
      }
    };

    socket.on('booking_update', handleBookingUpdate);

    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect();
    };
  }, [booking, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg shadow-xl w-full max-w-sm relative text-white">
        <button onClick={() => onClose(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <XMarkIcon className="h-7 w-7" />
        </button>
        <h2 className="text-2xl font-bold text-white mb-4 text-center">Cobrar con QR</h2>
        
        <div className="p-4 bg-gray-900 rounded-lg flex flex-col items-center justify-center min-h-[300px]">
          {loading && <InlineLoading text="Generando QR..." />}
          
          {error && <ErrorMessage message={error} />}
          
          {qrData && paymentStatus === 'pending' && (
            <>
              <p className="text-lg font-semibold text-center">Escanee para pagar:</p>
              <p className="text-3xl font-bold text-secondary text-center mb-4">${booking.price}</p>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={qrData} size={200} />
              </div>
              <p className="text-sm text-gray-400 mt-3 text-center">El QR expira en 30 minutos.</p>
              <p className="text-md text-yellow-dark mt-2 text-center">Esperando confirmación de pago...</p>
            </>
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
