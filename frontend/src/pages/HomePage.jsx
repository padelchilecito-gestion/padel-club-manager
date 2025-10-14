import React, { useState } from 'react';
import TimeSlotFinder from '../components/TimeSlotFinder.jsx';
import BookingModal from '../components/BookingModal.jsx';
import { bookingService } from '../services/bookingService.js';
import { useAuth } from '../contexts/AuthContext.jsx';

const HomePage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const { user } = useAuth();

  const handleTimeSelect = (court, time, date) => {
    if (!user) {
      alert('Debes iniciar sesión para realizar una reserva.');
      return;
    }
    setSelectedBooking({ court, time, date });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleConfirmBooking = async () => {
    if (!selectedBooking) return;

    try {
      const bookingData = {
        courtId: selectedBooking.court._id,
        startTime: selectedBooking.time,
        userId: user._id,
        paymentMethod: 'Mercado Pago',
        isPaid: true,
      };

      const paymentData = {
        items: [{
          title: `Reserva de ${selectedBooking.court.name} a las ${selectedBooking.time.toLocaleTimeString()}`,
          unit_price: selectedBooking.court.price || 50,
          quantity: 1,
        }],
        metadata: {
          booking_details: bookingData
        }
      };

      alert('Redirigiendo a la pasarela de pago... (simulado)');
      // const preference = await bookingService.createPaymentPreference(paymentData);
      // window.location.href = preference.init_point;

    } catch (error) {
      console.error('Error creating booking:', error);
      alert('No se pudo crear la reserva.');
    } finally {
      handleCloseModal();
    }
  };

  return (
    <>
      <header className="text-center my-8">
        <h1 className="text-5xl font-bold text-primary">Padel Club Manager</h1>
        <p className="text-text-secondary mt-2">Encuentra y reserva tu cancha de pádel en segundos</p>
      </header>
      
      <main className="max-w-4xl mx-auto">
        <TimeSlotFinder onTimeSelect={handleTimeSelect} />
      </main>

      <BookingModal
        isOpen={isModalOpen}
        booking={selectedBooking}
        onClose={handleCloseModal}
        onConfirm={handleConfirmBooking}
      />
    </>
  );
};

export default HomePage;