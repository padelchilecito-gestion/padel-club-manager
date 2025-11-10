import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const PaymentSuccessPage = () => {
  return (
    <div className="container mx-auto p-4 text-center flex flex-col items-center justify-center min-h-[60vh]">
      <CheckCircleIcon className="h-32 w-32 text-secondary mb-6" />
      <h1 className="text-5xl font-bold text-primary mb-4">¡Pago Aprobado!</h1>
      <p className="text-xl text-text-secondary mb-8">
        Tu reserva ha sido confirmada con éxito. ¡Te esperamos en el club!
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors"
      >
        Volver al Inicio
      </Link>

      <footer className="text-center mt-12 py-4 border-t border-gray-700 w-full">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default PaymentSuccessPage;
