import React, { useState, useEffect, useMemo } from 'react';
import { courtService } from '../services/courtService';
import { bookingService } from '../services/bookingService';
import { format, addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';

// Helper to generate time slots for a day
const generateTimeSlots = (date, bookedSlots) => {
    const slots = [];
    const now = new Date();
    const dayStart = startOfDay(date);

    for (let i = 8 * 60; i < 23 * 60; i += 30) { // De 8:00 a 22:30, en intervalos de 30 min
        const slotStart = setMinutes(setHours(dayStart, 0), i);
        if (slotStart < now) continue; // Skip past slots

        const slotEnd = addMinutes(slotStart, 30);
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

    // --- NUEVOS ESTADOS ---
    const [showUserForm, setShowUserForm] = useState(false);
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    // ----------------------

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingError, setBookingError] = useState('');

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                setLoading(true);
                const data = await courtService.getAllCourts();
                const activeCourts = data.filter(c => c.isActive);
                setCourts(activeCourts);
                if (activeCourts.length > 0) {
                    setSelectedCourt(activeCourts[0]._id);
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
        setShowUserForm(false); // Ocultar formulario si se cambia la selección
        setSelectedSlots(prev =>
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort((a, b) => a - b)
        );
    };

    const { totalPrice, startTime, endTime } = useMemo(() => {
        if (selectedSlots.length === 0) return { totalPrice: 0, startTime: null, endTime: null };

        const court = courts.find(c => c._id === selectedCourt);
        const price = court ? selectedSlots.length * (court.pricePerHour / 2) : 0; // Precio por slot de 30 min
        const start = selectedSlots[0];
        const end = addMinutes(selectedSlots[selectedSlots.length - 1], 30);

        return { totalPrice: price, startTime: start, endTime: end };
    }, [selectedSlots, selectedCourt, courts]);

    const handleProceedToBooking = () => {
        if (selectedSlots.length === 0) {
            setBookingError('Por favor, selecciona al menos un turno.');
            return;
        }
        setBookingError('');
        setShowUserForm(true); // Mostrar el formulario de datos del usuario
    };

    const handleFinalizeBooking = async (paymentMethod) => {
        if (!userName || !userPhone) {
            setBookingError('El nombre y el teléfono son obligatorios.');
            return;
        }

        setBookingError('');
        setLoading(true);

        const bookingData = {
            courtId: selectedCourt,
            user: { name: userName, phone: userPhone },
            startTime,
            endTime,
            paymentMethod,
            isPaid: paymentMethod !== 'Efectivo',
        };

        try {
            if (paymentMethod === 'Mercado Pago') {
                const court = courts.find(c => c._id === selectedCourt);
                const paymentData = {
                    items: [{
                        title: `Reserva cancha ${court.name} - ${format(startTime, 'dd/MM HH:mm')}`,
                        unit_price: totalPrice,
                        quantity: 1,
                    }],
                    payer: { name: userName, email: "test_user@test.com" },
                    metadata: { bookingData }
                };
                const preference = await bookingService.createPaymentPreference(paymentData);
                window.location.href = preference.init_point;
            } else {
                const newBooking = await bookingService.createBooking(bookingData);
                alert(`¡Reserva confirmada! Tu turno para el ${format(new Date(newBooking.startTime), 'dd/MM/yyyy HH:mm')} ha sido creado.`);

                // Limpiar y recargar
                setShowUserForm(false);
                setUserName('');
                setUserPhone('');
                const data = await bookingService.getAvailability(selectedCourt, selectedDate);
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

            {/* --- SECCIÓN DE RESUMEN Y FORMULARIO MODIFICADA --- */}
            {selectedSlots.length > 0 && (
                <div className="mt-6 p-4 bg-dark-primary rounded-lg border border-gray-700">
                    <h3 className="text-lg font-bold text-primary">Resumen de tu Reserva</h3>

                    {/* Muestra el rango de horas */}
                    <p className="text-text-primary mt-2">
                        Horario: <span className="font-semibold">{format(startTime, 'HH:mm')} a {format(endTime, 'HH:mm')}</span>
                    </p>

                    <p className="text-2xl font-bold text-secondary mt-2">
                        Total: ${totalPrice.toFixed(2)}
                    </p>

                    {bookingError && <p className="text-danger text-sm mt-2">{bookingError}</p>}

                    {/* Si el formulario no está visible, muestra el botón para continuar */}
                    {!showUserForm && (
                         <button
                            onClick={handleProceedToBooking}
                            className="w-full mt-4 bg-secondary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors"
                        >
                            Reservar
                        </button>
                    )}

                    {/* Formulario de datos del usuario (condicional) */}
                    {showUserForm && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                            <h4 className="text-md font-semibold text-text-primary mb-3">Completa tus datos</h4>
                            <div className="space-y-4">
                                 <div>
                                    <label htmlFor="userName" className="block text-sm font-medium text-text-secondary">Nombre Completo</label>
                                    <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} required className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" />
                                 </div>
                                  <div>
                                    <label htmlFor="userPhone" className="block text-sm font-medium text-text-secondary">Teléfono (con código de área)</label>
                                    <input type="tel" id="userPhone" value={userPhone} onChange={(e) => setUserPhone(e.target.value)} required className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" />
                                 </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 mt-4">
                                <button
                                    onClick={() => handleFinalizeBooking('Efectivo')}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'Confirmar (Pago en club)'}
                                </button>
                                <button
                                    onClick={() => handleFinalizeBooking('Mercado Pago')}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50"
                                    disabled={loading}
                                >
                                    {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimeSlotFinder;