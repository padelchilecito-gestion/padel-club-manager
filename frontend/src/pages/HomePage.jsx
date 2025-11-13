import React from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder.jsx';
import { usePublicSettings } from '../contexts/PublicSettingsContext'; 

const HomePage = () => {
  const { settings } = usePublicSettings();

  return (
    <div className="container mx-auto p-4">
      <header className="text-center my-8">
        {/* --- Títulos DINÁMICOS y RESPONSIVOS --- */}
        <h1 className="text-4xl md:text-5xl font-bold text-primary">{settings.publicTitle}</h1> {/* <-- MODIFICADO */}
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
