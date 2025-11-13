import React from 'react';
import QRCode from 'react-qr-code';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

/**
 * Modal de QR en pantalla completa.
 *
 * @param {string} qrValue - La URL de Mercado Pago para el QR.
 * @param {number} total - El monto total a mostrar.
 * @param {string} status - 'pending' | 'successful'
 * @param {function} onClose - Función para cerrar el modal.
 */
const FullScreenQRModal = ({ qrValue, total, status, onClose }) => {
  return (
    // Fondo oscuro semi-transparente
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4">
      
      {/* Contenedor del QR */}
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-md text-center relative">
        
        {/* Botón de Cerrar (Cancelar) */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-white"
        >
          <XMarkIcon className="h-8 w-8" />
        </button>

        {/* Vista de Pago Exitoso */}
        {status === 'successful' ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <CheckCircleIcon className="h-32 w-32 text-secondary" />
            <h2 className="text-2xl font-bold mt-4 text-text-primary">¡Pago Recibido!</h2>
            <p className="text-3xl font-bold text-secondary mt-2">${total.toFixed(2)}</p>
            <button 
              onClick={onClose} 
              className="w-full mt-12 bg-primary hover:bg-primary-dark text-white font-bold p-3 rounded-md"
            >
              Cerrar
            </button>
          </div>
        ) : (
          // Vista de QR (Esperando pago)
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold mb-6 text-primary">Escanea para Pagar</h2>
            <div className="bg-white p-4 rounded-lg">
              <QRCode value={qrValue} size={256} />
            </div>
            <p className="text-3xl font-bold text-secondary mt-6">${total.toFixed(2)}</p>
            
            {status === 'pending' && (
              <p className="text-xl text-yellow-400 mt-4 animate-pulse">
                Esperando confirmación de pago...
              </p>
            )}
            
            <button 
              onClick={onClose} 
              className="w-full mt-8 bg-gray-600 hover:bg-gray-500 text-white font-bold p-3 rounded-md"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullScreenQRModal;
