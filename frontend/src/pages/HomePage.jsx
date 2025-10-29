// frontend/src/pages/HomePage.jsx
// ARCHIVO SIMPLIFICADO Y CORREGIDO

import React from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder';
// Ya no necesitamos 'getSettings', 'useState', 'useEffect', 'FullPageLoading', ni 'ErrorMessage'.

const HomePage = () => {
  // No necesitamos cargar settings aquí.
  // El componente TimeSlotFinder es ahora autónomo.
  // Llama a la API del backend (/api/courts/availability/:date), 
  // y el backend (courtController) es el que carga la configuración
  // de horarios ('MONDAY_IS_OPEN', etc.) desde la base de datos.
  
  // Simplemente renderizamos el título y el componente.
  return (
    <div>
      <h1 className="text-3xl font-bold text-center text-white mb-8">
        Reserva tu Cancha
      </h1>
      <TimeSlotFinder />
    </div>
  );
};

export default HomePage;
