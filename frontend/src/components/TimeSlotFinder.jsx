import React, { useState, useEffect, useMemo } from 'react';
import { courtService } from '../services/courtService';
import { bookingService } from '../services/bookingService';
// --- SERVICIO IMPORTADO ---
import { settingService } from '../services/settingService';
// --- FUNCIONES DE DATE-FNS IMPORTADAS ---
import { format, addMinutes, setHours, setMinutes, startOfDay, getDay } from 'date-fns';

// --- LÓGICA DE GENERACIÓN DE TURNOS REESCRITA ---
/**
 * Genera los turnos de 30 min basándose en 3 criterios:
 * 1. El turno es en el futuro.
 * 2. El turno NO está ya reservado (bookedSlots).
 * 3. El club ESTÁ abierto en ese horario (businessHours).
 */
const generateTimeSlots = (date, bookedSlots, businessHours) => {
    const slots = [];
    if (!businessHours) return slots; // No generar nada si no se cargaron los horarios

    const now = new Date();
    const dayStart = startOfDay(date);
    const dayIndex = getDay(date); // 0 = Domingo, 1 = Lunes, ...

    const scheduleForDay = businessHours[dayIndex];
    if (!scheduleForDay) return slots; // No hay horario para este día

    // Iteramos por los 48 bloques de 30 minutos del día (24 horas * 2)
    for (let i = 0; i < 48; i++) {
        const slotStart = addMinutes(dayStart, i * 30);
        
        // Criterio 1: El turno es en el futuro
        if (slotStart < now) continue;

        // Criterio 2: El club ESTÁ abierto (basado en la grilla)
        // scheduleForDay[i] debe ser 'true'
        if (!scheduleForDay[i]) continue;

        // Criterio 3: El turno NO está ya reservado
        const slotEnd = addMinutes(slotStart, 30);
        const isBooked = bookedSlots.some(booked => {
            const bookedStart = new Date(booked.startTime);
            const bookedEnd = new Date(booked.endTime);
            // Revisa si el slot (ej: 10:00-10:30) se superpone con una reserva (ej: 09:30-10:30)
            return (slotStart < bookedEnd && slotEnd > bookedStart);
        });

        if (!isBooked) {
            slots.push(slotStart);
        }
    }
    return slots;
};
// ------------------------------------------------

const TimeSlotFinder = () => {
    const [courts, setCourts] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState('');
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    
    // --- NUEVO ESTADO PARA HORARIOS ---
    const [businessHours, setBusinessHours] = useState(null);
    // ----------------------------------

    const [bookedSlots, setBookedSlots] = useState([]);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlots, setSelectedSlots] = useState([]);

    const [showUserForm, setShowUserForm] = useState(false);
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookingError, setBookingError] = useState('');

    // Efecto 1: Cargar canchas (sin cambios)
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

    // --- NUEVO EFECTO ---
    // Efecto 2: Cargar horarios de apertura
    useEffect(() => {
        const fetchBusinessHours = async () => {
            try {
                const hoursData = await settingService.getPublicBusinessHours();
                setBusinessHours(hoursData);
            } catch (err) {
                // No bloqueamos al usuario, pero mostramos un error si falla
                setError(prev => prev + ' No se pudieron cargar los horarios del club.');
            }
        };
        fetchBusinessHours();
    }, []);
    // --------------------

    // Efecto 3: Cargar turnos ocupados (sin cambios)
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

    // --- EFECTO MODIFICADO ---
    // Efecto 4: Generar turnos disponibles
    // Ahora depende de businessHours
    useEffect(() => {
        const dateForSlots = new Date(selectedDate + 'T00:00:00'); // Asume zona horaria local
        
        // Pasamos los horarios de apertura a la función
        const slots = generateTimeSlots(dateForSlots, bookedSlots, businessHours);
        
        setAvailableSlots(slots);
        setSelectedSlots([]);
    }, [bookedSlots, selectedDate, businessHours]);
    // -------------------------

    const handleSlotClick = (slot) => {
        setShowUserForm(false); 
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
        setShowUserForm(true);
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
                {(loading || !businessHours) && <p className="text-text-secondary">Cargando turnos...</p>}
                
                {/* --- LÓGICA DE RENDERIZADO MODIFICADA --- */}
                {/* Solo mostramos slots si businessHours cargó */}
                {businessHours && !loading && availableSlots.length > 0 ? (
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
                    businessHours && !loading && <p className="text-text-secondary">No hay turnos disponibles para esta fecha.</p>
                )}
                {/* -------------------------------------- */}
            </div>

            {selectedSlots.length > 0 && (
                <div className="mt-6 p-4 bg-dark-primary rounded-lg border border-gray-700">
                    <h3 className="text-lg font-bold text-primary">Resumen de tu Reserva</h3>
                    <p className="text-text-primary mt-2">
                        Horario: <span className="font-semibold">{format(startTime, 'HH:mm')} a {format(endTime, 'HH:mm')}</span>
                    </p>
                    <p className="text-2xl font-bold text-secondary mt-2">
                        Total: ${totalPrice.toFixed(2)}
                    </p>

                    {bookingError && <p className="text-danger text-sm mt-2">{bookingError}</p>}

                    {!showUserForm && (
                         <button
                            onClick={handleProceedToBooking}
                            className="w-full mt-4 bg-secondary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors"
                        >
                            Reservar
                        </button>
                    )}

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
