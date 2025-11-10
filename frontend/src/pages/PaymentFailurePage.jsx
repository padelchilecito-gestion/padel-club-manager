import React from 'react';
import { Link } from 'react-router-dom';
import { XCircleIcon } from '@heroicons/react/24/solid';

const PaymentFailurePage = () => {
  return (
    <div className="container mx-auto p-4 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <XCircleIcon className="h-32 w-32 text-danger mb-6" />
      <h1 className="text-5xl font-bold text-danger mb-4">Pago Rechazado</h1>
      <p className="text-xl text-text-secondary mb-8">
        Hubo un problema al procesar tu pago. Por favor, inténtalo nuevamente.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors"
      >
        Volver a Intentar
      </Link>

      <footer className="text-center mt-12 py-4 border-t border-gray-700 w-full">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default PaymentFailurePage;
