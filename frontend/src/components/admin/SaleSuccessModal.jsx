import React, { useEffect } from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

/**
 * Un modal que muestra un mensaje de éxito y se cierra
 * automáticamente o al presionar un botón.
 */
const SaleSuccessModal = ({ onClose }) => {
  
  // Cierra automáticamente el modal después de 2 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // 2 segundos

    // Limpia el timer si el componente se desmonta antes
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    // Fondo oscuro
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
      
      {/* Contenedor del Modal (estilo basado en tus otros modales) */}
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-sm text-center">
        
        <div className="flex flex-col items-center justify-center">
          {/* Icono de Éxito (color 'secondary' de tu tailwind.config.js) */}
          <CheckCircleIcon className="h-20 w-20 text-secondary mb-4" />
          
          <h2 className="text-2xl font-bold text-text-primary">¡Venta Registrada!</h2>
          
          <p className="text-text-secondary mt-2">
            El stock ha sido actualizado.
          </p>
          
          {/* Botón para cierre manual (color 'primary') */}
          <button 
            onClick={onClose} 
            className="w-full mt-6 bg-primary hover:bg-primary-dark text-white font-bold p-3 rounded-md"
          >
            Cerrar
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default SaleSuccessModal;
