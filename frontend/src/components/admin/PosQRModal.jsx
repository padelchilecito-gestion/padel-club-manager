// frontend/src/components/admin/PosQRModal.jsx - ARCHIVO NUEVO
import React, { useState, useEffect } from 'react';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import { paymentService } from '../../services/paymentService';
import socket from '../../services/socketService';
import { InlineLoading, ErrorMessage } from '../ui/Feedback';
import { QRCodeSVG } from 'qrcode.react';

const PosQRModal = ({ cart, totalAmount, onClose }) => {
  const [qrValueString, setQrValueString] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [saleId, setSaleId] = useState(null);

  // Escuchar confirmación de pago por Socket.IO
  useEffect(() => {
    socket.connect();
    
    // Nuevo listener para 'sale_update'
    const handleSaleUpdate = (updatedSale) => {
      // Comprobar que el saleId existe y coincide
      if (saleId && updatedSale._id === saleId && updatedSale.status === 'Completed') {
        console.log(`💰 Pago de Venta POS ${saleId} confirmado`);
        setPaymentStatus('success');
        // Esperar 2.5 seg y llamar a onClose(true) para indicar éxito
        setTimeout(() => { onClose(true); }, 2500);
      }
    };
    
    socket.on('sale_update', handleSaleUpdate);
    
    // Generar QR al montar el componente
    const generateQR = async () => {
      try {
        setLoading(true);
        setError(null);
        // Llamar a la nueva función del servicio de pago
        const data = await paymentService.generatePosQR(cart, totalAmount);
        
        if (data.init_point) {
          setQrValueString(data.init_point); // Esta es la URL de pago
          setSaleId(data.saleId); // Guardamos el ID de la venta pendiente
        } else {
          throw new Error('No se recibió el link de pago (init_point)');
        }
      } catch (err) {
        console.error('❌ Error generando QR para POS:', err);
        setError(err.message || 'No se pudo generar el código QR');
      } finally {
        setLoading(false);
      }
    };

    generateQR();

    // Limpieza al desmontar el componente
    return () => {
      socket.off('sale_update', handleSaleUpdate);
      socket.disconnect();
    };
    // El array de dependencias está casi vacío para que solo se ejecute 1 vez
  }, [cart, totalAmount, onClose, saleId]); // saleId se agrega para asegurar que el listener lo tenga

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-xl relative">
          <button 
            onClick={() => onClose(false)} // onClose(false) indica que se cerró sin pagar
            className="absolute top-4 right-4 text-white hover:text-gray-200"
            aria-label="Cerrar"
          >
            <XMarkIcon className="h-7 w-7" />
          </button>
          <h2 className="text-2xl font-bold text-white">
            Pagar con Mercado Pago
          </h2>
        </div>

        {/* Body */}
        <div className="p-6">
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}
          
          {loading && <InlineLoading text="Generando QR de pago..." />}

          {!loading && !error && paymentStatus === 'pending' && qrValueString && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="bg-white p-8 rounded-lg flex flex-col items-center">
                <QRCodeSVG 
                  value={qrValueString} // La URL de init_point
                  size={256} 
                  level="H" 
                  includeMargin={true}
                  className="shadow-xl"
                />
                <p className="text-gray-800 font-semibold mt-4 text-center text-lg">
                  Escanear con Mercado Pago
                </p>
              </div>
              
              <p className="text-3xl font-bold text-white mt-3 text-center border-t border-gray-700 pt-3">
                <span className="text-gray-400 text-lg">Total:</span> ${totalAmount}
              </p>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 text-center">
                <div className="animate-pulse">
                  <p className="text-yellow-300 font-semibold">⏳ Esperando confirmación...</p>
                </div>
              </div>
            </div>
          )}

          {/* Éxito */}
          {paymentStatus === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircleIcon className="h-24 w-24 text-green-500 mb-4 animate-bounce" />
              <h3 className="text-3xl font-bold text-green-400 mb-2">¡Pago Confirmado!</h3>
              <p className="text-gray-300 mb-4">La venta ha sido registrada.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PosQRModal;
