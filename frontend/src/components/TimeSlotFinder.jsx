import React, { useState, useEffect, useMemo } from 'react';
import { courtService } from '../services/courtService';
import { bookingService } from '../services/bookingService';
import { format, addHours, setHours, setMinutes, startOfDay } from 'date-fns';

// Helper to generate time slots for a day
const generateTimeSlots = (date, bookedSlots) => {
    const slots = [];
    const now = new Date();
    const dayStart = startOfDay(date);

    for (let i = 8 * 60; i < 23 * 60; i += 30) { // De 8:00 a 22:30, en intervalos de 30 min
        const slotStart = setMinutes(setHours(dayStart, 0), i);

        // Skip past slots
        if (slotStart < now) continue;

        const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
        const isBooked = bookedSlots.some(booked => {
            const bookedStart = new Date(booked.startTime);
            const bookedEnd = new Date(booked.endTime);
            return (slotStart < bookedEnd && slotEnd > bookedStart);
        });

        if (!isBooked) {
            slots.push(slotStart);
        }
    }
    return slots;
};


const TimeSlotFinder = () => {
    const [courts, setCourts] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [bookedSlots, setBookedSlots] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingError, setBookingError] = useState('');

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                setLoading(true);
                const data = await courtService.getAllCourts();
                setCourts(data.filter(c => c.isActive));
                if (data.length > 0) {
                    setSelectedCourt(data[0]._id);
                }
            } catch (err) {
                setError('No se pudieron cargar las canchas.');
            } finally {
                setLoading(false);
            }
        };
        fetchCourts();
    }, []);

    useEffect(() => {
        if (!selectedCourt || !selectedDate) return;

        const fetchAvailability = async () => {
            try {
                setLoading(true);
                setError('');
                const data = await bookingService.getAvailability(selectedCourt, selectedDate);
                setBookedSlots(data);
            } catch (err) {
                setError('No se pudo cargar la disponibilidad.');
            } finally {
                setLoading(false);
            }
        };
        fetchAvailability();
    }, [selectedCourt, selectedDate]);

    useEffect(() => {
        const dateForSlots = new Date(selectedDate + 'T00:00:00');
        const slots = generateTimeSlots(dateForSlots, bookedSlots);
        setAvailableSlots(slots);
        setSelectedSlots([]);
    }, [bookedSlots, selectedDate]);

    const handleSlotClick = (slot) => {
        setSelectedSlots(prev =>
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort()
        );
    };

    const totalPrice = useMemo(() => {
        const court = courts.find(c => c._id === selectedCourt);
        return court ? selectedSlots.length * court.pricePerHour : 0;
    }, [selectedSlots, selectedCourt, courts]);

    const handleBooking = async (paymentMethod) => {
        if (selectedSlots.length === 0) {
            setBookingError('Por favor, selecciona al menos un turno.');
            return;
        }

        setBookingError('');
        setLoading(true);

        // This is a simplified user data collection. A real form would be better.
        const userData = {
            name: prompt("Por favor, ingresa tu nombre:"),
            phone: prompt("Por favor, ingresa tu número de teléfono (con código de país):")
        };

        if (!userData.name || !userData.phone) {
            setBookingError('El nombre y el teléfono son obligatorios.');
            setLoading(false);
            return;
        }

        const bookingData = {
            courtId: selectedCourt,
            user: userData,
            startTime: selectedSlots[0],
            // --- Línea corregida ---
            endTime: new Date(selectedSlots[selectedSlots.length - 1].getTime() + 30 * 60000),
            // --------------------
            paymentMethod,
            isPaid: paymentMethod !== 'Efectivo',
        };

        try {
            if (paymentMethod === 'Mercado Pago') {
                const court = courts.find(c => c._id === selectedCourt);
                const paymentData = {
                    items: [{
                        title: `Reserva de cancha ${court.name}`,
                        unit_price: totalPrice,
                        quantity: 1,
                    }],
                    payer: { name: userData.name, email: "test_user@test.com" }, // Email should be collected
                    metadata: { bookingData } // We send booking data to be processed by webhook
                };
                const preference = await bookingService.createPaymentPreference(paymentData);
                window.location.href = preference.init_point; // Redirect to Mercado Pago
            } else {
                const newBooking = await bookingService.createBooking(bookingData);
                alert(`¡Reserva confirmada! Tu reserva para el ${format(newBooking.startTime, 'dd/MM/yyyy HH:mm')} ha sido creada.`);
                // Refetch availability
                const date = new Date(selectedDate);
                const data = await bookingService.getAvailability(selectedCourt, date.toISOString());
                setBookedSlots(data);
            }
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Ocurrió un error al crear la reserva.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-dark-secondary p-6 md:p-8 rounded-lg shadow-lg">
            {error && <p className="text-danger text-center mb-4">{error}</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label htmlFor="court-select" className="block text-sm font-medium text-text-secondary mb-1">Cancha</label>
                    <select
                        id="court-select"
                        value={selectedCourt}
                        onChange={(e) => setSelectedCourt(e.target.value)}
                        className="w-full bg-dark-primary border border-gray-600 rounded-md p-2 text-text-primary focus:ring-primary focus:border-primary"
                        disabled={loading}
                    >
                        {courts.map(court => (
                            <option key={court._id} value={court._id}>{court.name} ({court.courtType})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date-select" className="block text-sm font-medium text-text-secondary mb-1">Fecha</label>
                    <input
                        type="date"
                        id="date-select"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full bg-dark-primary border border-gray-600 rounded-md p-2 text-text-primary focus:ring-primary focus:border-primary"
                        disabled={loading}
                    />
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold text-text-primary mb-3">Turnos Disponibles</h3>
                {loading && <p className="text-text-secondary">Cargando turnos...</p>}
                {!loading && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {availableSlots.map(slot => (
                            <button
                                key={slot.toISOString()}
                                onClick={() => handleSlotClick(slot)}
                                className={`p-2 rounded-md text-center font-semibold transition-colors ${
                                    selectedSlots.includes(slot)
                                        ? 'bg-primary text-white'
                                        : 'bg-dark-primary hover:bg-primary-dark'
                                }`}
                            >
                                {format(slot, 'HH:mm')}
                            </button>
                        ))}
                    </div>
                ) : (
                    !loading && <p className="text-text-secondary">No hay turnos disponibles para esta fecha.</p>
                )}
            </div>

            {selectedSlots.length > 0 && (
                <div className="mt-6 p-4 bg-dark-primary rounded-lg border border-gray-700">
                    <h3 className="text-lg font-bold text-primary">Resumen de tu Reserva</h3>
                    <p className="text-text-primary mt-2">
                        Turnos: {selectedSlots.map(s => format(s, 'HH:mm')).join(', ')}
                    </p>
                    <p className="text-2xl font-bold text-secondary mt-2">
                        Total: ${totalPrice.toFixed(2)}
                    </p>
                    {bookingError && <p className="text-danger text-sm mt-2">{bookingError}</p>}
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <button
                            onClick={() => handleBooking('Efectivo')}
                            className="w-full bg-secondary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                            disabled={loading}
                        >
                            {loading ? 'Procesando...' : 'Reservar (Pago en el club)'}
                        </button>
                        <button
                             onClick={() => handleBooking('Mercado Pago')}
                             className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                             disabled={loading}
                        >
                            {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotFinder;