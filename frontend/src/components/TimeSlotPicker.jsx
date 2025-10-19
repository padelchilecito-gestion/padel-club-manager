import React from 'react';
import { format } from 'date-fns';

const TimeSlotPicker = ({ timeSlots, onSelectTime }) => {
  if (timeSlots.length === 0) {
    return <p className="text-center text-text-secondary mt-8">No hay horarios disponibles para esta fecha.</p>;
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-center text-text-primary mb-4">2. Elige un Horario</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
        {timeSlots.map(slot => (
          <button
            key={slot}
            onClick={() => onSelectTime(slot)}
            className="px-4 py-3 bg-secondary hover:bg-primary-dark text-white font-bold rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-primary focus:ring-primary"
          >
            {format(new Date(slot), 'HH:mm')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimeSlotPicker;