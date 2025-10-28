import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, QrCodeIcon } from '@heroicons/react/24/solid';
import { paymentService } from '../../services/paymentService'; // Importa el servicio actualizado
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
// Necesitamos qrcode.react para mostrar el QR
import { QRCodeSVG } from 'qrcode.react'; // Asegúrate que esté en package.json

const PaymentQRModal = ({ booking, onClose }) => {
  // Estado para guardar el string EMVCo del QR
  const [qrDataString, setQrDataString] = useState(null); 
  const [amount, setAmount] = useState(0); // Para mostrar el monto
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');

  // 1. Generar QR dinámico al abrir
  useEffect(() => {
    if (!booking) return;

    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Llamar a la función correcta del servicio
        const data = await paymentService.generateBookingQR(booking._id); 
        
        if (data.qr_data) {
          setQrDataString(data.qr_data); // Guardar el string EMVCo
          setAmount(data.amount || booking.price); // Guardar el monto
          console.log('✅ QR Dinámico (String EMVCo) recibido:', data.qr_data);
        } else {
          throw new Error('No se recibió el código QR desde el backend.');
        }
      } catch (err) {
        console.error('❌ Error generando QR en el modal:', err);
        setError(err.message || 'No se pudo generar el código QR.');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [booking]);

  // 2. Escuchar confirmación de pago por Socket.IO (SIN CAMBIOS)
  useEffect(() => {
    socket.connect();
    const handleBookingUpdate = (updatedBooking) => {
      if (updatedBooking._id === booking._id && updatedBooking.isPaid) {
        console.log('💰 Pago confirmado por webhook/socket');
        setPaymentStatus('success');
        setTimeout(() => { onClose(true); }, 2500);
      }
    };
    socket.on('booking_update', handleBookingUpdate);
    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect();
    };
  }, [booking, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-xl relative">
          <button 
            onClick={() => onClose(false)} 
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <QrCodeIcon className="h-8 w-8 mr-3" />
            Escanear para Pagar
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
          
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <InlineLoading text="Generando código QR..." />
            </div>
          )}

          {/* QR Code Display */}
          {!loading && qrDataString && paymentStatus === 'pending' && (
            <div className="space-y-6">
              {/* Información */}
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Detalles de la Reserva</h3>
                <div className="space-y-2 text-gray-300">
                  <p><span className="text-gray-400">Cliente:</span> {booking.user.name} {booking.user.lastName || ''}</p>
                  <p className="text-3xl font-bold text-white mt-3">
                    <span className="text-gray-400 text-lg">Total:</span> ${amount}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 md:p-8 rounded-lg flex flex-col items-center">
                 {/* Usamos QRCodeSVG con el string qrDataString */}
                <QRCodeSVG 
                  value={qrDataString} 
                  size={256} // Tamaño ajustado para pantallas
                  level="H" // Alta corrección de errores
                  includeMargin={true}
                  className="shadow-xl"
                />
                <p className="text-gray-800 font-semibold mt-4 text-center text-lg">
                  Escaneá con la app de Mercado Pago
                </p>
              </div>

              {/* Instrucciones */}
              <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-4">
                 <h4 className="font-semibold text-cyan-300 mb-2">📱 Instrucciones</h4>
                 <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                   <li>Abrí la app de <strong>Mercado Pago</strong></li>
                   <li>Tocá en <strong>"Pagar con QR"</strong></li>
                   <li>Escaneá este código</li>
                   <li>Confirmá el pago de ${amount}</li>
                 </ol>
               </div>

              {/* Estado de espera */}
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
                <div className="animate-pulse">
                  <p className="text-yellow-300 font-semibold">⏳ Esperando confirmación de pago...</p>
                  <p className="text-sm text-gray-400 mt-2">Recibiremos la notificación automáticamente</p>
                </div>
              </div>
            </div>
          )}

          {/* Estado de éxito */}
          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <CheckCircleIcon className="h-24 w-24 text-green-500 mb-4 animate-bounce" />
               <h3 className="text-3xl font-bold text-green-400 mb-2">¡Pago Confirmado!</h3>
               <p className="text-gray-300 mb-4">La reserva ha sido marcada como pagada</p>
               <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 w-full">
                 <p className="text-green-300 font-semibold">✓ Pago procesado correctamente</p>
                 <p className="text-sm text-gray-400 mt-1">ID Reserva: {booking._id}</p>
               </div>
             </div>
          )}
        </div>

        {/* Footer */}
        {!loading && paymentStatus === 'pending' && (
          <div className="bg-gray-750 px-6 py-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={() => onClose(false)}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg transition-colors"
            >
              Cerrar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentQRModal;
