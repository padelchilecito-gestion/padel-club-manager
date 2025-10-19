import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from './DatePicker';
import TimeSlotPicker from './TimeSlotPicker';
import CourtPicker from './CourtPicker';
import BookingModal from './BookingModal';
import { availabilityService } from '../services/availabilityService';
import { format } from 'date-fns';

const BookingFlow = () => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [availableCourts, setAvailableCourts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  const fetchTimeSlots = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const data = await availabilityService.getAvailableTimeSlots(formattedDate);
      setTimeSlots(data);
    } catch (err) {
      setError('No se pudo cargar la disponibilidad de horarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailableCourts = useCallback(async (date, time) => {
    setLoading(true);
    setError(null);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const formattedTime = new Date(time).toISOString();
      const data = await availabilityService.getAvailableCourts(formattedDate, formattedTime);
      setAvailableCourts(data);
    } catch (err) {
      setError('No se pudo cargar la disponibilidad de canchas.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTimeSlots(selectedDate);
  }, [selectedDate, fetchTimeSlots]);

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setStep(1);
    setSelectedTime(null);
    setAvailableCourts([]);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
    fetchAvailableCourts(selectedDate, time);
    setStep(2);
  };

  const handleCourtSelect = (court) => {
    setSelectedCourt(court);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourt(null);
    // Reset flow or refetch data as needed
    setStep(1);
    setSelectedTime(null);
    fetchTimeSlots(selectedDate);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-center text-primary mb-8">Reservar una Cancha</h1>

      <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />

      {loading && <p className="text-center text-text-secondary mt-8">Cargando...</p>}
      {error && <p className="text-center text-danger mt-8">{error}</p>}

      {!loading && !error && (
        <>
          {step === 1 && <TimeSlotPicker timeSlots={timeSlots} onSelectTime={handleTimeSelect} />}
          {step === 2 && (
            <CourtPicker
              courts={availableCourts}
              onSelectCourt={handleCourtSelect}
              onBack={handleBack}
            />
          )}
        </>
      )}

      {isModalOpen && selectedCourt && (
        <BookingModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          court={selectedCourt}
          startTime={selectedTime}
        />
      )}
    </div>
  );
};

export default BookingFlow;