import React from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder.jsx';
import { usePublicSettings } from '../contexts/PublicSettingsContext'; // --- IMPORTADO ---

const HomePage = () => {
  // --- OBTENEMOS LOS SETTINGS PÚBLICOS ---
  const { settings } = usePublicSettings();

  return (
    <div className="container mx-auto p-4">
      <header className="text-center my-8">
        {/* --- TÍTULOS DINÁMICOS --- */}
        <h1 className="text-5xl font-bold text-primary">{settings.publicTitle}</h1>
        <p className="text-text-secondary mt-2">{settings.publicSubtitle}</p>
      </header>
      
      <main>
        <TimeSlotFinder />
      </main>

      <footer className="text-center mt-12 py-4 border-t border-gray-700">
        <p className="text-text-secondary">&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

export default HomePage;
