// frontend/src/components/admin/PaymentQRModal.jsx - VERSIÓN SIMPLIFICADA (SOLO QR)
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, QrCodeIcon } from '@heroicons/react/24/solid';
import { paymentService } from '../../services/paymentService';
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';

const PaymentQRModal = ({ booking, onClose }) => {
  // Quitamos estados relacionados al 'webPaymentUrl'
  const [qrValueString, setQrValueString] = useState(null); 
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(true); // Inicia cargando para generar QR automáticamente
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // Escuchar confirmación de pago por Socket.IO
  useEffect(() => {
    socket.connect();
    const handleBookingUpdate = (updatedBooking) => {
      if (booking && updatedBooking._id === booking._id && updatedBooking.isPaid) {
        console.log(`💰 Pago confirmado para booking ${booking._id}`);
        setPaymentStatus('success');
        setTimeout(() => { onClose(true); }, 2500);
      }
    };
    socket.on('booking_update', handleBookingUpdate);

    // Generar QR automáticamente al montar el modal
    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log(`Solicitando QR para booking ${booking._id}`);
        
        const data = await paymentService.generateBookingQR(booking._id);
        
        if (data.init_point) {
          setQrValueString(data.init_point); 
          setAmount(data.amount || booking.price);
          console.log('✅ URL de pago (para QR) generada exitosamente');
        } else {
          throw new Error('No se recibió el link de pago (init_point) desde el backend');
        }
      } catch (err) {
        console.error('❌ Error generando QR:', err);
        setError(err.message || 'No se pudo generar el código QR');
      } finally {
        setLoading(false);
      }
    };

    generateQR(); // Llamar a la función

    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect();
    };
  }, [booking, onClose]); // Dependencias originales

  // Ya no necesitamos handleGenerateWebPayment ni handleBack

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-xl relative"> {/* Cambiado color */}
          <button 
            onClick={() => onClose(false)} 
            className="absolute top-4 right-4 text-white hover:text-gray-200"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <QrCodeIcon className="h-8 w-8 mr-3" />
            Escanear QR para Pagar
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
          
          {loading && <InlineLoading text="Generando código QR..." />}

          {/* Modo QR (Ahora es el único modo) */}
          {!loading && !error && qrValueString && paymentStatus === 'pending' && (
            <div className="space-y-6">
              {/* Info Reserva */}
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700 text-center">
                 <p className="text-gray-300 text-sm">
                   {booking?.court?.name || 'Cancha'} - {format(new Date(booking.startTime), 'dd/MM HH:mm')}
                 </p>
                 <p className="text-3xl font-bold text-white mt-1">
                   Total: ${amount}
                 </p>
               </div>
              
              {/* QR Code */}
              <div className="bg-white p-6 rounded-lg flex flex-col items-center"> {/* Ajustado padding */}
                <QRCodeSVG 
                  value={qrValueString} 
                  size={240} // Ligeramente más pequeño
                  level="H" 
                  includeMargin={true}
                  className="shadow-xl"
                />
                <p className="text-gray-800 font-semibold mt-4 text-center">
                  Cliente: escanear con Mercado Pago
                </p>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
                <div className="animate-pulse">
                  <p className="text-yellow-300 font-semibold">⏳ Esperando confirmación...</p>
                </div>
              </div>
              {/* Ya no hay botón "Cambiar método" */}
            </div>
          )}

          {/* Éxito */}
          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircleIcon className="h-24 w-24 text-green-500 mb-4 animate-bounce" />
              <h3 className="text-3xl font-bold text-green-400 mb-2">¡Pago Confirmado!</h3>
              <p className="text-gray-300 mb-4">La reserva ha sido marcada como pagada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentQRModal;
