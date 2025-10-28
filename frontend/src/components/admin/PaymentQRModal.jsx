import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, QrCodeIcon } from '@heroicons/react/24/solid';
import { paymentService } from '../../services/paymentService'; // Servicio actualizado
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
// Necesitamos qrcode.react para mostrar el QR
import { QRCodeSVG } from 'qrcode.react'; // Asegúrate que esté en frontend/package.json

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
        console.log(`Modal: Solicitando QR para booking ${booking._id}`); // Log
        // Llamar a la función correcta del servicio
        const data = await paymentService.generateBookingQR(booking._id); 
        
        if (data.qr_data) {
          setQrDataString(data.qr_data); // Guardar el string EMVCo
          setAmount(data.amount || booking.price); // Guardar el monto
          console.log('✅ Modal: QR Dinámico (String EMVCo) recibido:', data.qr_data); // Log
        } else {
          console.error('❌ Modal: No se recibió qr_data del backend', data); // Log
          throw new Error('No se recibió el código QR desde el backend.');
        }
      } catch (err) {
        console.error('❌ Modal: Error generando QR:', err); // Log
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
      // Importante: Chequea si la reserva actualizada es la MISMA que está en el modal
      if (booking && updatedBooking._id === booking._id && updatedBooking.isPaid) {
        console.log(`💰 Modal: Pago confirmado via Socket para booking ${booking._id}`); // Log
        setPaymentStatus('success');
        setTimeout(() => { onClose(true); }, 2500); // Cierra después de mostrar éxito
      }
    };
    socket.on('booking_update', handleBookingUpdate);
    // Limpieza al desmontar o si cambia el booking/onClose
    return () => {
      console.log("Modal: Desconectando listener de socket"); // Log
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect(); // Considera si realmente quieres desconectar aquí
    };
  }, [booking, onClose]); // Dependencias correctas

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-xl relative">
          <button 
            onClick={() => onClose(false)} 
            className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            aria-label="Cerrar modal"
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
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <InlineLoading text="Generando código QR..." />
            </div>
          )}

          {!loading && qrDataString && paymentStatus === 'pending' && (
            <div className="space-y-6">
              {/* Info Reserva */}
              <div className="bg-gray-900 p-4 rounded-lg border border-gray-700">
                <h3 className="text-lg font-semibold text-cyan-400 mb-3">Detalles</h3>
                <div className="space-y-1 text-gray-300 text-sm">
                  <p><span className="text-gray-400">Cliente:</span> {booking?.user?.name || 'N/A'} {booking?.user?.lastName || ''}</p>
                   <p><span className="text-gray-400">Cancha:</span> {booking?.court?.name || 'N/A'}</p> 
                  <p><span className="text-gray-400">Horario:</span> {format(new Date(booking.startTime), 'dd/MM HH:mm')}</p> 
                </div>
                 <p className="text-3xl font-bold text-white mt-3 text-center border-t border-gray-700 pt-3">
                    <span className="text-gray-400 text-lg">Total:</span> ${amount}
                  </p>
              </div>

              {/* QR Code */}
              <div className="bg-white p-6 md:p-8 rounded-lg flex flex-col items-center">
                <QRCodeSVG 
                  value={qrDataString} 
                  size={256} 
                  level="H" 
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

              {/* Espera */}
              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
                <div className="animate-pulse">
                  <p className="text-yellow-300 font-semibold">⏳ Esperando confirmación de pago...</p>
                  <p className="text-sm text-gray-400 mt-2">Recibiremos la notificación automáticamente</p>
                </div>
              </div>
            </div>
          )}

          {/* Éxito */}
          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
               <CheckCircleIcon className="h-24 w-24 text-green-500 mb-4 animate-bounce" />
               <h3 className="text-3xl font-bold text-green-400 mb-2">¡Pago Confirmado!</h3>
               <p className="text-gray-300 mb-4">La reserva ha sido marcada como pagada.</p>
             </div>
          )}
        </div>

        {/* Footer (solo si está pendiente) */}
        {!loading && paymentStatus === 'pending' && (
          <div className="bg-gray-750 px-6 py-4 border-t border-gray-700 flex justify-end rounded-b-xl">
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
