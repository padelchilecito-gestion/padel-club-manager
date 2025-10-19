import React from 'react';

const CourtPicker = ({ courts, onSelectCourt, onBack }) => {
  if (courts.length === 0) {
    return (
      <div className="text-center mt-8">
        <p className="text-text-secondary">No hay canchas disponibles para este horario.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold text-center text-text-primary mb-4">3. Elige una Cancha</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courts.map(court => (
          <div key={court._id} className="bg-dark-primary p-6 rounded-lg shadow-lg text-center">
            <h3 className="text-xl font-bold text-primary">{court.name}</h3>
            <p className="text-text-secondary">{court.courtType}</p>
            <p className="text-2xl font-bold text-white my-4">${court.pricePerHour.toLocaleString()}</p>
            <button
              onClick={() => onSelectCourt(court)}
              className="w-full px-4 py-3 bg-secondary hover:bg-primary-dark text-white font-bold rounded-lg transition-all duration-200"
            >
              Reservar
            </button>
          </div>
        ))}
      </div>
       <div className="text-center mt-8">
        <button onClick={onBack} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg">
            Atrás
        </button>
      </div>
    </div>
  );
};

export default CourtPicker;