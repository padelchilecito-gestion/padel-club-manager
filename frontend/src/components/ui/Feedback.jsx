import React from 'react';
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Componente para mensajes de error.
 */
export const ErrorMessage = ({ message, onClose }) => (
  <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative shadow-md" role="alert">
    <div className="flex items-center">
      <AlertCircle className="mr-3" size={20} />
      <div>
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-100 hover:text-white"
        >
          <XCircle size={20} />
        </button>
      )}
    </div>
  </div>
);

/**
 * Componente para mensajes de éxito.
 */
export const SuccessMessage = ({ message, onClose }) => (
  <div className="bg-green-900 border border-green-700 text-green-100 px-4 py-3 rounded-lg relative shadow-md" role="alert">
    <div className="flex items-center">
      <CheckCircle className="mr-3" size={20} />
      <div>
        <strong className="font-bold">Éxito: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 bottom-0 right-0 px-4 py-3 text-green-100 hover:text-white"
        >
          <XCircle size={20} />
        </button>
      )}
    </div>
  </div>
);

/**
 * Componente para mensajes de información.
 */
export const InfoMessage = ({ message, onClose }) => (
  <div className="bg-blue-900 border border-blue-700 text-blue-100 px-4 py-3 rounded-lg relative shadow-md" role="alert">
    <div className="flex items-center">
      <AlertCircle className="mr-3" size={20} />
      <div>
        <strong className="font-bold">Info: </strong>
        <span className="block sm:inline">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 bottom-0 right-0 px-4 py-3 text-blue-100 hover:text-white"
        >
          <XCircle size={20} />
        </button>
      )}
    </div>
  </div>
);

/**
 * Spinner de carga genérico.
 */
export const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };
  return (
    <div
      className={`animate-spin rounded-full border-4 border-t-indigo-500 border-gray-700 ${sizeClasses[size]}`}
      role="status"
    >
      <span className="sr-only">Cargando...</span>
    </div>
  );
};

/**
 * Overlay de carga de página completa.
 */
export const FullPageLoading = ({ text = 'Cargando...' }) => (
  <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col items-center justify-center z-50">
    <LoadingSpinner size="lg" />
    <p className="text-white text-lg mt-4">{text}</p>
  </div>
);

/**
 * Indicador de carga en línea.
 */
export const InlineLoading = ({ text = 'Cargando...' }) => (
  <div className="flex items-center justify-center p-4">
    <LoadingSpinner size="sm" />
    <span className="text-gray-300 ml-2">{text}</span>
  </div>
);
