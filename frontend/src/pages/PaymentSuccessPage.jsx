import React from 'react';
// --- IMPORTACIONES NUEVAS ---
import { Link, useLocation } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz'; // Importar time-zone helper
// ----------------------------
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { usePublicSettings } from '../contexts/PublicSettingsContext'; 

const timeZone = 'America/Argentina/Buenos_Aires';

const PaymentSuccessPage = () => {
  const { settings } = usePublicSettings();
  const ownerNumber = (settings.ownerNotificationNumber || '').replace(/[^0-9]/g, '');
  
  // --- LÓGICA NUEVA PARA LEER URL (SOLUCIONA BUG 3) ---
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const name = queryParams.get('name') || '[TU NOMBRE]';
  let fecha = '[FECHA DE TU TURNO]';
  let hora = '[HORA DE TU TURNO]';

  // Intentamos formatear las fechas si vienen en la URL
  try {
    const startTimeStr = queryParams.get('startTime');
    const endTimeStr = queryParams.get('endTime');
    
    if (startTimeStr && endTimeStr) {
        // Convertimos de ISO (UTC) a la hora local de Argentina
        const startTime = utcToZonedTime(parseISO(startTimeStr), timeZone);
        const endTime = utcToZonedTime(parseISO(endTimeStr), timeZone);
        
        fecha = format(startTime, 'dd/MM/yyyy');
        hora = `${format(startTime, 'HH:mm')} a ${format(endTime, 'HH:mm')}`;
    }
  } catch (e) {
      console.error("Error parsing dates from URL", e);
  }
  // --- FIN LÓGICA NUEVA ---

  // Mensaje de WhatsApp ahora rellenado
  const msg = `¡Hola! Acabo de realizar un pago de reserva a través de Mercado Pago.\n\nMi reserva es para:\n- Nombre: ${name}\n- Día: ${fecha}\n- Hora: ${hora}\n\n¡Nos vemos en el club!`;
  const whatsappLink = `https://wa.me/${ownerNumber}?text=${encodeURIComponent(msg)}`;

  return (
    <div className="container mx-auto p-4 text-center flex flex-col items-center justify-center min-h-[70vh]">
      <CheckCircleIcon className="h-32 w-32 text-secondary mb-6" />
      <h1 className="text-5xl font-bold text-primary mb-4">¡Pago Aprobado!</h1>
      <p className="text-xl text-text-secondary mb-8">
        Tu reserva ha sido confirmada con éxito.
      </p>
      
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
      
      <p className="text-text-secondary mt-6 max-w-md">
        Por favor, haz clic en "Notificar al Club" para enviar la confirmación al dueño con tus datos.
      </p>

      <footer className="text-center mt-12 py-4 border-t border-gray-700 w-full">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default PaymentSuccessPage;
