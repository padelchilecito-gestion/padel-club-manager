// frontend/src/components/admin/PaymentQRModal.jsx - VERSIÓN CORREGIDA
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, QrCodeIcon, CreditCardIcon } from '@heroicons/react/24/solid';
import { paymentService } from '../../services/paymentService';
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
import { QRCodeSVG } from 'qrcode.react'; // Esta librería ya convierte un string (la URL) en QR
import { format } from 'date-fns';

const PaymentQRModal = ({ booking, onClose }) => {
  const [paymentMode, setPaymentMode] = useState(null); // null | 'qr' | 'web'
  
  // --- CAMBIO 1: Cambiamos el nombre del estado para que sea más claro ---
  const [qrValueString, setQrValueString] = useState(null); // Ya no es 'qr_data', es la URL 'init_point'
  
  const [webPaymentUrl, setWebPaymentUrl] = useState(null);
  const [amount, setAmount] = useState(0);
  const [loading, setLoading] = useState(false);
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
    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.disconnect();
    };
  }, [booking, onClose]);

  // Generar QR
  const handleGenerateQR = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Solicitando QR para booking ${booking._id}`);
      
      const data = await paymentService.generateBookingQR(booking._id);
      
      // --- CAMBIO 2: Buscamos 'init_point' en lugar de 'qr_data' ---
      if (data.init_point) {
        setQrValueString(data.init_point); // Guardamos la URL
        setAmount(data.amount || booking.price);
        setPaymentMode('qr');
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

  // Generar link web
  const handleGenerateWebPayment = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`Solicitando link web para booking ${booking._id}`);
      
      const data = await paymentService.generatePaymentLink(booking._id);
      
      if (data.init_point) {
        setWebPaymentUrl(data.init_point);
        setAmount(booking.price);
        setPaymentMode('web');
        console.log('✅ Link de pago generado');
        
        // Abrir automáticamente en nueva pestaña
        window.open(data.init_point, '_blank');
      } else {
        throw new Error('No se recibió el link de pago');
      }
    } catch (err) {
      console.error('❌ Error generando link:', err);
      setError(err.message || 'No se pudo generar el link de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setPaymentMode(null);
    setQrValueString(null); // Usar el nuevo nombre de estado
    setWebPaymentUrl(null);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-6 rounded-t-xl relative">
          <button 
            onClick={() => onClose(false)} 
            className="absolute top-4 right-4 text-white hover:text-gray-200"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
          <h2 className="text-2xl font-bold text-white flex items-center">
            {paymentMode === 'qr' ? <QrCodeIcon className="h-8 w-8 mr-3" /> : 
             paymentMode === 'web' ? <CreditCardIcon className="h-8 w-8 mr-3" /> :
             <CreditCardIcon className="h-8 w-8 mr-3" />}
            {paymentMode ? 'Procesar Pago' : 'Seleccionar Método'}
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
          
          {/* Selección de método */}
          {!paymentMode && paymentStatus === 'pending' && (
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
                  <span className="text-gray-400 text-lg">Total:</span> ${booking.price}
                </p>
              </div>

              {/* Botones de método */}
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={handleGenerateQR}
                  disabled={loading}
                  className="p-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <QrCodeIcon className="h-12 w-12 mx-auto text-white mb-2" />
                  <p className="text-white font-bold text-lg">Mostrar QR</p>
                  <p className="text-purple-200 text-sm mt-1">Cliente escanea en persona</p>
                </button>

                <button
                  onClick={handleGenerateWebPayment}
                  disabled={loading}
                  className="p-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CreditCardIcon className="h-12 w-12 mx-auto text-white mb-2" />
                  <p className="text-white font-bold text-lg">Enviar Link</p>
                  <p className="text-blue-200 text-sm mt-1">Cliente paga desde su celular</p>
                </button>
              </div>

              {loading && <InlineLoading text="Generando método de pago..." />}
            </div>
          )}

          {/* Modo QR */}
          {/* --- CAMBIO 3: Usamos qrValueString --- */}
          {paymentMode === 'qr' && qrValueString && paymentStatus === 'pending' && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-white p-8 rounded-lg flex flex-col items-center">
                <QRCodeSVG 
                  value={qrValueString} // <--- El valor es la URL
                  size={256} 
                  level="H" 
                  includeMargin={true}
                  className="shadow-xl"
                />
                <p className="text-gray-800 font-semibold mt-4 text-center text-lg">
                  Cliente: escanear con Mercado Pago
                </p>
              </div>

              <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-4">
                <h4 className="font-semibold text-cyan-300 mb-2">📱 Instrucciones</h4>
                <ol className="text-sm text-gray-300 space-y-2 list-decimal list-inside">
                  <li>Abrir app <strong>Mercado Pago</strong></li>
                  <li>Tocar <strong>"Pagar con QR"</strong></li>
                  <li>Escanear este código</li>
                  <li>Confirmar pago de ${amount}</li>
                </ol>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
                <div className="animate-pulse">
                  <p className="text-yellow-300 font-semibold">⏳ Esperando confirmación...</p>
                </div>
              </div>

              <button
                onClick={handleBack}
                className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg"
              >
                ← Cambiar método
              </button>
            </div>
          )}

          {/* Modo Web */}
          {paymentMode === 'web' && webPaymentUrl && paymentStatus === 'pending' && (
            <div className="space-y-6">
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-6 text-center">
                <CreditCardIcon className="h-16 w-16 mx-auto text-blue-400 mb-4" />
                <p className="text-white font-bold text-lg mb-4">Link enviado</p>
                <p className="text-gray-300 text-sm mb-4">
                  Se abrió una nueva pestaña. Si no la ves, usa este botón:
                </p>
                <a
                  href={webPaymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                >
                  Abrir Mercado Pago
                </a>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
                <p className="text-yellow-300 font-semibold">⏳ Esperando confirmación del pago...</p>
                <p className="text-sm text-gray-400 mt-2">El cliente debe completar el pago en Mercado Pago</p>
              </div>

              <button
                onClick={handleBack}
                className="w-full py-2 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg"
              >
                ← Cambiar método
              </button>
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
