import React from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder.jsx';

const HomePage = () => {
  return (
    <>
      <header className="text-center my-8">
        <h1 className="text-5xl font-bold text-primary">Padel Club Manager</h1>
        <p className="text-text-secondary mt-2">Encuentra y reserva tu cancha de pádel en segundos</p>
      </header>
      
      <main>
        <TimeSlotFinder />
      </main>
    </>
  );
};

export default HomePage;
