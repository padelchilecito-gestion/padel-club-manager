import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { paymentService } from '../../services/paymentService';
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
import { QRCodeSVG } from 'qrcode.react'; // Mantenemos esta librería

const PaymentQRModal = ({ booking, onClose }) => {
  // --- CAMBIO: Usaremos qrCode (string) como principal ---
  const [qrCode, setQrCode] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  useEffect(() => {
    if (!booking) return;

    const generate = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await paymentService.generateQR(booking._id);
        // --- CAMBIO: Priorizar qr_code (string) ---
        if (data.qr_code) {
           setQrCode(data.qr_code); 
        } else if (data.qr_code_base64) {
            // Si solo viene base64 (menos común con Preferencias), podrías intentar mostrarlo
            // como imagen, pero QRCodeSVG es más estándar. Vamos a mostrar un error si
            // qr_code (string) no está.
             console.warn("QR Code string not found, received base64 instead. Display might fail.");
             setError("Formato de QR no compatible recibido desde Mercado Pago.");
             // setQrCode(data.qr_code_base64); // O intentar usarlo si tienes un <img>
        } else {
            throw new Error('No se recibió información válida del QR.');
        }

      } catch (err) {
        setError(err.message || 'No se pudo generar el QR.');
      } finally {
        setLoading(false);
      }
    };

    generate();
  }, [booking]);

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
          
          {/* --- CAMBIO: Usar qrCode (string) con QRCodeSVG --- */}
          {qrCode && paymentStatus === 'pending' && (
            <>
              <p className="text-lg font-semibold text-center">Escanee para pagar:</p>
              <p className="text-3xl font-bold text-secondary text-center mb-4">${booking.price}</p>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={qrCode} size={200} /> 
              </div>
              <p className="text-sm text-gray-400 mt-3 text-center">El QR expira pronto.</p>
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
