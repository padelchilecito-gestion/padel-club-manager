import React, { useState, useEffect, useMemo } from 'react';
import { courtService } from '../services/courtService';
import { bookingService } from '../services/bookingService';
import { format, addMinutes, setHours, setMinutes, startOfDay, parseISO } from 'date-fns';

const TimeSlotFinder = () => {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [allBookings, setAllBookings] = useState([]);
    const [allCourts, setAllCourts] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedCourt, setSelectedCourt] = useState('');

    // Estados para el formulario
    const [userName, setUserName] = useState('');
    const [userPhone, setUserPhone] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [bookingError, setBookingError] = useState('');

    // 1. Efecto para buscar la disponibilidad de TODAS las canchas al cambiar la fecha
    useEffect(() => {
        if (!selectedDate) return;

        const fetchAllAvailability = async () => {
            try {
                setLoading(true);
                setError('');
                setSelectedSlot(null);
                setSelectedCourt('');
                const data = await bookingService.getAllCourtsAvailability(selectedDate);
                setAllCourts(data.courts || []);
                setAllBookings(data.bookings || []);
            } catch (err) {
                const errorMsg = err.response ? `${err.response.status} - ${JSON.stringify(err.response.data)}` : err.message;
                setError(`Error al cargar disponibilidad: ${errorMsg}`);
            } finally {
                setLoading(false);
            }
        };
        fetchAllAvailability();
    }, [selectedDate]);

    // 2. Genera las franjas horarias de 30 minutos y calcula la disponibilidad
    const availableTimeSlots = useMemo(() => {
        if (allCourts.length === 0) return [];

        const slots = [];
        const now = new Date();
        const dayStart = startOfDay(parseISO(selectedDate));

        for (let i = 8 * 2; i < 23 * 2; i++) { // De 8:00 a 22:30, en bloques de 30 min
            const slotStart = addMinutes(dayStart, i * 30);
            if (slotStart < now) continue;

            const availableCourts = allCourts.filter(court => {
                return !allBookings.some(booking => {
                    const bookingStart = new Date(booking.startTime);
                    const bookingEnd = new Date(booking.endTime);
                    return booking.court === court._id && (slotStart < bookingEnd && addMinutes(slotStart, 30) > bookingStart);
                });
            });

            if (availableCourts.length > 0) {
                slots.push({ time: slotStart, courts: availableCourts });
            }
        }
        return slots;
    }, [selectedDate, allBookings, allCourts]);

    const courtDetails = allCourts.find(c => c._id === selectedCourt);

    const handleBooking = async () => {
        if (!selectedSlot || !selectedCourt || !userName || !userPhone) {
            setBookingError('Por favor, completa todos los campos: turno, cancha, nombre y teléfono.');
            return;
        }

        setBookingError('');
        setLoading(true);

        const bookingData = {
            courtId: selectedCourt,
            user: { name: userName, phone: userPhone },
            startTime: selectedSlot.time,
            endTime: addMinutes(selectedSlot.time, 30), // Reserva por 30 minutos
            paymentMethod: 'Efectivo', // Por defecto
            isPaid: false,
        };

        try {
            const newBooking = await bookingService.createBooking(bookingData);
            alert(`¡Reserva confirmada! Tu turno para el ${format(newBooking.startTime, 'dd/MM/yyyy HH:mm')} ha sido creado.`);
            // Resetear y recargar
            setSelectedSlot(null);
            setSelectedCourt('');
            setUserName('');
            setUserPhone('');
            const data = await bookingService.getAllCourtsAvailability(selectedDate);
            setAllCourts(data.courts || []);
            setAllBookings(data.bookings || []);
        } catch (err) {
            setBookingError(err.response?.data?.message || 'Ocurrió un error al crear la reserva.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-dark-secondary p-6 md:p-8 rounded-lg shadow-lg">
            {error && <p className="text-danger text-center mb-4">{error}</p>}
            
            {/* Paso 1: Seleccionar Fecha */}
            <div className="mb-8">
                <label htmlFor="date-select" className="block text-xl font-semibold text-text-primary mb-2">1. Elige una fecha</label>
                <input
                    type="date"
                    id="date-select"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full md:w-1/2 bg-dark-primary border border-gray-600 rounded-md p-2 text-text-primary focus:ring-primary focus:border-primary"
                    disabled={loading}
                />
            </div>

            {/* Paso 2: Seleccionar Horario */}
            <div className="mb-8">
                <h3 className="text-xl font-semibold text-text-primary mb-3">2. Elige un horario disponible</h3>
                {loading && <p className="text-text-secondary">Buscando turnos...</p>}
                {!loading && availableTimeSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {availableTimeSlots.map(slot => (
                            <button
                                key={slot.time.toISOString()}
                                onClick={() => { setSelectedSlot(slot); setSelectedCourt(''); }}
                                className={`p-2 rounded-md text-center font-semibold transition-colors ${
                                    selectedSlot?.time.toISOString() === slot.time.toISOString()
                                        ? 'bg-primary text-white ring-2 ring-offset-2 ring-offset-dark-secondary ring-primary'
                                        : 'bg-dark-primary hover:bg-primary-dark'
                                }`}
                            >
                                {format(slot.time, 'HH:mm')}
                            </button>
                        ))}
                    </div>
                ) : (
                    !loading && <p className="text-text-secondary">No hay turnos disponibles para esta fecha.</p>
                )}
            </div>

            {/* Paso 3: Seleccionar Cancha y completar datos */}
            {selectedSlot && (
                <div className="mt-6 p-4 bg-dark-primary rounded-lg border border-gray-700">
                    <h3 className="text-xl font-semibold text-text-primary mb-3">3. Elige una cancha para las {format(selectedSlot.time, 'HH:mm')} hs</h3>
                    <div className="flex flex-wrap gap-2 mb-6">
                        {selectedSlot.courts.map(court => (
                            <button
                                key={court._id}
                                onClick={() => setSelectedCourt(court._id)}
                                className={`px-4 py-2 rounded-md font-semibold transition-colors ${
                                    selectedCourt === court._id
                                    ? 'bg-secondary text-dark-primary'
                                    : 'bg-dark-secondary hover:bg-gray-600'
                                }`}
                            >
                                {court.name}
                            </button>
                        ))}
                    </div>

                    {selectedCourt && (
                        <div>
                            <h3 className="text-xl font-semibold text-text-primary mb-4">4. Completa tus datos</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <input type="text" placeholder="Tu Nombre" value={userName} onChange={e => setUserName(e.target.value)} className="w-full bg-dark-secondary p-2 rounded-md border border-gray-600" />
                                <input type="tel" placeholder="Tu Teléfono (sin 0 y sin 15)" value={userPhone} onChange={e => setUserPhone(e.target.value)} className="w-full bg-dark-secondary p-2 rounded-md border border-gray-600" />
                            </div>
                            {bookingError && <p className="text-danger text-sm mt-2 mb-4">{bookingError}</p>}
                            <button
                                onClick={handleBooking}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 px-4 rounded-md transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Procesando...' : `Confirmar Reserva en ${courtDetails?.name} por $${courtDetails?.pricePerHour / 2}`}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TimeSlotFinder;