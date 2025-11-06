// frontend/src/components/admin/PaymentQRModal.jsx (CORREGIDO)
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import paymentService from '../../services/paymentService'; 
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';

function PaymentQRModal({ bookingId, amount, onClose, onPaymentSuccess }) {
  const [qrCodeBase64, setQrCodeBase64] = useState(null); // Usaremos base64
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'success', 'failure'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!bookingId || !amount) {
        setError("Faltan datos (ID de Reserva o Monto) para generar el QR.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPaymentStatus('pending');

      try {
        // 1. Construir el array 'items' que el backend unificado espera
        const paymentItems = [
          {
            id: bookingId,
            title: 'Reserva de Cancha',
            quantity: 1,
            unit_price: amount,
          }
        ];
        
        // 2. Llamar a la función UNIFICADA
        const data = await paymentService.createQrPayment({ 
          bookingId: bookingId, 
          items: paymentItems,
          totalAmount: amount
        });
        
        // 3. Usar el QR en base64
        if (data.qr_code_base64) {
          setQrCodeBase64(`data:image/jpeg;base64,${data.qr_code_base64}`);
        } else {
          setQrCodeBase64(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(data.init_point)}`);
        }

      } catch (err) {
        console.error("Error generating MP preference:", err);
        setError(err.message || 'Error al generar el código QR.');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [bookingId, amount]);

  useEffect(() => {
    // 4. Escuchar el evento de socket correcto
    const onBookingUpdate = (updatedBooking) => {
      if (updatedBooking._id === bookingId && updatedBooking.isPaid) {
        console.log(`Socket event received: Reserva ${bookingId} pagada.`);
        setPaymentStatus('success');
        onPaymentSuccess(updatedBooking); // Notificar al componente padre
      }
    };

    socket.on('bookingUpdated', onBookingUpdate);

    // Limpieza al desmontar
    return () => {
      socket.off('bookingUpdated', onBookingUpdate);
    };
  }, [bookingId, onPaymentSuccess]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h3 className="text-xl font-semibold text-center text-gray-800 mb-4">Escanea para Pagar</h3>

        {loading && (
          <div className="flex flex-col items-center justify-center h-48">
            <InlineLoading text="Generando código QR..." />
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center h-48">
            <ErrorMessage message={error} />
          </div>
        )}

        {!loading && !error && paymentStatus === 'pending' && qrCodeBase64 && (
          <div className="flex flex-col items-center">
            <img src={qrCodeBase64} alt="Código QR de Mercado Pago" className="w-64 h-64 border rounded" />
            <p className="mt-4 text-lg font-bold text-gray-700">Total: ${amount.toFixed(2)}</p>
            <p className="mt-2 text-sm text-gray-500">Esperando confirmación de pago...</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CheckCircleIcon className="w-20 h-20 text-success mb-4" />
            <h4 className="text-2xl font-bold text-success">¡Pago Exitoso!</h4>
            <p className="text-gray-600">Tu reserva ha sido confirmada.</p>
          </div>
        )}

        {paymentStatus === 'failure' && !loading && (
           <div className="flex flex-col items-center justify-center h-48 text-center">
            <ErrorMessage message={error || "El pago falló. Intenta de nuevo."} />
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentQRModal;
