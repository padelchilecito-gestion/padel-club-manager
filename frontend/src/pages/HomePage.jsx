import React from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder'; // Importamos el buscador
import { usePublicSettings } from '../contexts/PublicSettingsContext'; // Importamos los settings públicos

const HomePage = () => {
  const { settings } = usePublicSettings(); // Obtenemos los títulos y subtítulos

  return (
    <div className="container mx-auto p-4 md:p-8">
      {/* Usamos los títulos y subtítulos que defines en el panel de admin 
        (tal como se configuran en PublicSettingsContext.jsx)
      */}
      <header className="text-center my-8">
        <h1 className="text-5xl font-bold text-primary">
          {settings.publicTitle || 'Padel Club'}
        </h1>
        <p className="text-xl text-text-secondary mt-2">
          {settings.publicSubtitle || 'Encuentra y reserva tu cancha'}
        </p>
      </header>

      <main>
        {/* Renderizamos el componente de reservas directamente aquí
        */}
        <TimeSlotFinder />
      </main>

      <footer className="text-center mt-12 py-4 border-t border-gray-700">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default HomePage;
