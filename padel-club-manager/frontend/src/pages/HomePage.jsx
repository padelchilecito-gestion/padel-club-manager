import React from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder';

const HomePage = () => {
  return (
    <div className="container mx-auto p-4">
      <header className="text-center my-8">
        <h1 className="text-5xl font-bold text-primary">Padel Club Manager</h1>
        <p className="text-text-secondary mt-2">Encuentra y reserva tu cancha de pádel en segundos</p>
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