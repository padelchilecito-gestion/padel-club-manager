import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { usePublicSettings } from '../contexts/PublicSettingsContext'; // --- IMPORTADO ---

const PaymentSuccessPage = () => {
  // --- OBTENEMOS EL NÚMERO DEL DUEÑO ---
  const { settings } = usePublicSettings();
  const ownerNumber = settings.ownerNotificationNumber.replace(/[^0-9]/g, '');
  
  // Mensaje genérico (no tenemos los detalles de la reserva aquí)
  const msg = `¡Hola! Acabo de realizar un pago de reserva a través de Mercado Pago. ¡Nos vemos en el club!`;
  const whatsappLink = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="container mx-auto p-4 text-center flex flex-col items-center justify-center min-h-[70vh]">
      <CheckCircleIcon className="h-32 w-32 text-secondary mb-6" />
      <h1 className="text-5xl font-bold text-primary mb-4">¡Pago Aprobado!</h1>
      <p className="text-xl text-text-secondary mb-8">
        Tu reserva ha sido confirmada con éxito.
      </p>
      
      {/* --- SECCIÓN DE BOTONES MODIFICADA --- */}
      <div className="flex flex-col sm:flex-row gap-4">
        {ownerNumber && (
           <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 bg-secondary text-dark-primary font-bold rounded-md transition-colors hover:bg-green-400"
            >
              Notificar al Club por WhatsApp
            </a>
        )}
        <Link
          to="/"
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors"
        >
          Volver al Inicio
        </Link>
      </div>
      {/* ---------------------------------- */}

      <footer className="text-center mt-12 py-4 border-t border-gray-700 w-full">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default PaymentSuccessPage;
