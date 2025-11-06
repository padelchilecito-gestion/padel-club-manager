// frontend/src/components/admin/PosQRModal.jsx (CORREGIDO)
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon, QrCodeIcon } from '@heroicons/react/24/solid';
import paymentService from '../../services/paymentService'; // <-- CORRECCIÓN: Se quitaron las llaves {}
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';

function PosQRModal({ saleId, items, totalAmount, onClose, onPaymentSuccess }) {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending', 'success', 'failure'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferenceId, setPreferenceId] = useState(null);

  useEffect(() => {
    const generateQR = async () => {
      if (!saleId || !items || !totalAmount) {
        setError("Faltan datos (ID de Venta, Items o Monto) para generar el QR.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setPaymentStatus('pending');

      try {
        const data = await paymentService.generatePosQR({ 
          saleId, 
          items,
          totalAmount 
        });
        
        // Asumiendo que MP devuelve la URL para el QR en 'init_point'
        // Esto podría necesitar un generador de QR si 'init_point' es solo un string
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(data.init_point)}`);
        setPreferenceId(data.preferenceId);

      } catch (err) {
        console.error("Error generating POS QR:", err);
        setError(err.message || 'Error al generar el código QR.');
      } finally {
        setLoading(false);
      }
    };

    generateQR();
  }, [saleId, items, totalAmount]);

  useEffect(() => {
    if (!preferenceId) return;

    // Escuchar eventos de socket para esta preferencia específica
    const paymentTopic = `payment:status:${preferenceId}`;
    
    socket.on(paymentTopic, (data) => {
      console.log(`Socket event received: ${paymentTopic}`, data);
      if (data.status === 'approved') {
        setPaymentStatus('success');
        onPaymentSuccess(data); // Notificar al componente padre
      } else if (data.status === 'rejected' || data.status === 'cancelled' || data.status === 'failure') {
        setPaymentStatus('failure');
        setError('El pago fue rechazado o cancelado.');
      }
    });

    // Limpieza al desmontar
    return () => {
      socket.off(paymentTopic);
    };
  }, [preferenceId, onPaymentSuccess]);

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

        {!loading && !error && paymentStatus === 'pending' && qrCodeUrl && (
          <div className="flex flex-col items-center">
            <img src={qrCodeUrl} alt="Código QR de Mercado Pago" className="w-64 h-64 border rounded" />
            <p className="mt-4 text-lg font-bold text-gray-700">Total: ${totalAmount.toFixed(2)}</p>
            <p className="mt-2 text-sm text-gray-500">Esperando confirmación de pago...</p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <CheckCircleIcon className="w-20 h-20 text-success mb-4" />
            <h4 className="text-2xl font-bold text-success">¡Pago Exitoso!</h4>
            <p className="text-gray-600">La venta ha sido registrada.</p>
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

export default PosQRModal;
