import React, { useState, useEffect } from 'react';
import { format, addMinutes, setHours, setMinutes, startOfDay, getDay, addDays } from 'date-fns';
import { es } from 'date-fns/locale';

const HomePage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [step, setStep] = useState(1);
  const [timeSlots, setTimeSlots] = useState([]);
  const [courts, setCourts] = useState([
    { id: 1, name: 'Cancha 1', type: 'Cemento', price: 5000 },
    { id: 2, name: 'Cancha 2', type: 'Césped Sintético', price: 6000 },
    { id: 3, name: 'Cancha 3', type: 'Cristal', price: 7000 },
  ]);

  // Generar próximos 7 días
  const getNextDays = () => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(new Date(), i));
    }
    return days;
  };

  // Generar horarios disponibles
  useEffect(() => {
    const dayOfWeek = getDay(selectedDate);
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const openingHour = isWeekend ? 9 : 8;
    const closingHour = isWeekend ? 23 : 22;

    const slots = [];
    let currentTime = setMinutes(setHours(startOfDay(selectedDate), openingHour), 0);
    const endTime = setMinutes(setHours(startOfDay(selectedDate), closingHour), 0);

    while (currentTime < endTime) {
      slots.push(new Date(currentTime));
      currentTime = addMinutes(currentTime, 60); // Bloques de 1 hora
    }
    setTimeSlots(slots);
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    setSelectedCourt(null);
    setStep(1);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    setStep(2);
  };

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
    setStep(3);
  };

  const handleConfirmBooking = () => {
    alert(`¡Reserva confirmada!\n\nCancha: ${selectedCourt.name}\nFecha: ${format(selectedDate, "d 'de' MMMM", { locale: es })}\nHora: ${format(selectedTime, 'HH:mm')}\nPrecio: $${selectedCourt.price}`);
    // Aquí irían las llamadas a la API
    resetBooking();
  };

  const resetBooking = () => {
    setSelectedTime(null);
    setSelectedCourt(null);
    setStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-primary">
      {/* Header */}
      <header className="bg-dark-secondary/80 backdrop-blur-sm shadow-lg sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Padel Club
              </h1>
              <p className="text-text-secondary mt-1">Reserva tu cancha en segundos</p>
            </div>
            <button className="px-6 py-3 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-lg hover:shadow-lg hover:scale-105 transition-all">
              Iniciar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <StepIndicator number={1} active={step >= 1} completed={step > 1} label="Fecha y Hora" />
            <div className={`h-1 w-16 ${step > 1 ? 'bg-secondary' : 'bg-gray-600'} transition-all`} />
            <StepIndicator number={2} active={step >= 2} completed={step > 2} label="Seleccionar Cancha" />
            <div className={`h-1 w-16 ${step > 2 ? 'bg-secondary' : 'bg-gray-600'} transition-all`} />
            <StepIndicator number={3} active={step >= 3} completed={false} label="Confirmar" />
          </div>
        </div>

        {/* Step 1: Seleccionar Fecha */}
        <div className="bg-dark-secondary rounded-2xl shadow-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
            <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">1</span>
            Selecciona Fecha y Hora
          </h2>

          {/* Date Selector */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-text-secondary mb-4">Fecha</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-3">
              {getNextDays().map((date) => {
                const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => handleDateSelect(date)}
                    className={`p-4 rounded-xl font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-lg scale-105'
                        : 'bg-dark-primary text-text-secondary hover:bg-primary/20 hover:text-primary'
                    }`}
                  >
                    <div className="text-xs uppercase">{format(date, 'EEE', { locale: es })}</div>
                    <div className="text-2xl">{format(date, 'd')}</div>
                    <div className="text-xs">{format(date, 'MMM', { locale: es })}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Selector */}
          <div>
            <h3 className="text-lg font-semibold text-text-secondary mb-4">Horario</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {timeSlots.map((time) => {
                const isSelected = selectedTime && format(time, 'HH:mm') === format(selectedTime, 'HH:mm');
                const isPast = time < new Date();
                return (
                  <button
                    key={time.toISOString()}
                    onClick={() => !isPast && handleTimeSelect(time)}
                    disabled={isPast}
                    className={`p-4 rounded-lg font-bold text-lg transition-all ${
                      isPast
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : isSelected
                        ? 'bg-secondary text-dark-primary shadow-lg scale-105'
                        : 'bg-dark-primary text-text-primary hover:bg-secondary/20 hover:text-secondary hover:scale-105'
                    }`}
                  >
                    {format(time, 'HH:mm')}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 2: Seleccionar Cancha */}
        {step >= 2 && (
          <div className="bg-dark-secondary rounded-2xl shadow-2xl p-8 mb-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
              <span className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">2</span>
              Selecciona tu Cancha
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {courts.map((court) => {
                const isSelected = selectedCourt?.id === court.id;
                return (
                  <button
                    key={court.id}
                    onClick={() => handleCourtSelect(court)}
                    className={`p-6 rounded-xl transition-all transform hover:scale-105 ${
                      isSelected
                        ? 'bg-gradient-to-br from-primary to-primary-dark text-white shadow-2xl'
                        : 'bg-dark-primary text-text-primary hover:bg-primary/10 border-2 border-transparent hover:border-primary'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-4xl mb-3">🎾</div>
                      <h3 className="text-xl font-bold mb-2">{court.name}</h3>
                      <p className={`text-sm mb-3 ${isSelected ? 'text-white/80' : 'text-text-secondary'}`}>
                        {court.type}
                      </p>
                      <div className={`text-2xl font-bold ${isSelected ? 'text-white' : 'text-secondary'}`}>
                        ${court.price}
                      </div>
                      <div className="text-xs mt-1 opacity-75">por hora</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 3: Confirmar Reserva */}
        {step >= 3 && (
          <div className="bg-dark-secondary rounded-2xl shadow-2xl p-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-text-primary mb-6 flex items-center">
              <span className="bg-secondary text-dark-primary rounded-full w-8 h-8 flex items-center justify-center mr-3 text-sm">3</span>
              Confirma tu Reserva
            </h2>

            <div className="bg-dark-primary rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm text-text-secondary mb-2">Fecha</h3>
                  <p className="text-xl font-bold text-text-primary">
                    {format(selectedDate, "EEEE d 'de' MMMM", { locale: es })}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-text-secondary mb-2">Horario</h3>
                  <p className="text-xl font-bold text-text-primary">
                    {format(selectedTime, 'HH:mm')} - {format(addMinutes(selectedTime, 60), 'HH:mm')}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm text-text-secondary mb-2">Cancha</h3>
                  <p className="text-xl font-bold text-text-primary">{selectedCourt.name}</p>
                  <p className="text-sm text-text-secondary">{selectedCourt.type}</p>
                </div>
                <div>
                  <h3 className="text-sm text-text-secondary mb-2">Total a Pagar</h3>
                  <p className="text-3xl font-bold text-secondary">${selectedCourt.price}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={resetBooking}
                className="flex-1 px-8 py-4 bg-gray-600 text-white font-bold rounded-lg hover:bg-gray-500 transition-all"
              >
                Modificar Reserva
              </button>
              <button
                onClick={handleConfirmBooking}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-secondary to-primary text-dark-primary font-bold rounded-lg hover:shadow-2xl hover:scale-105 transition-all"
              >
                Confirmar y Pagar
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-dark-secondary/50 mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-text-secondary">
          <p>&copy; 2024 Padel Club Manager. Todos los derechos reservados.</p>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
};

const StepIndicator = ({ number, active, completed, label }) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
          completed
            ? 'bg-secondary text-dark-primary'
            : active
            ? 'bg-primary text-white'
            : 'bg-gray-600 text-gray-400'
        }`}
      >
        {completed ? '✓' : number}
      </div>
      <p className={`text-xs mt-2 ${active ? 'text-text-primary' : 'text-text-secondary'}`}>
        {label}
      </p>
    </div>
  );
};

export default HomePage;