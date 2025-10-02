import React, { useState, useEffect, useMemo } from 'react';
import { courtService } from '../services/courtService';
import { bookingService } from '../services/bookingService';
import { format, addHours, setHours, setMinutes, startOfDay, isToday } from 'date-fns';

// Helper to generate time slots for a day
const generateTimeSlots = (date, bookedSlots) => {
    const slots = [];
    const now = new Date();
    const dayStart = startOfDay(new Date(date));

    for (let i = 8; i < 23; i++) { // From 8:00 to 22:00
        const slotStart = setMinutes(setHours(dayStart, i), 0);

        if (isToday(dayStart) && slotStart < now) continue;

        const slotEnd = addHours(slotStart, 1);
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
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');

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
                const date = new Date(selectedDate + 'T00:00:00');
                const data = await bookingService.getAvailability(selectedCourt, date.toISOString());
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
        const slots = generateTimeSlots(selectedDate, bookedSlots);
        setAvailableSlots(slots);
        setSelectedSlots([]);
    }, [bookedSlots, selectedDate]);

    const handleSlotClick = (slot) => {
        setSelectedSlots(prev =>
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot].sort((a,b) => a - b)
        );
    };

    const totalPrice = useMemo(() => {
        const court = courts.find(c => c._id === selectedCourt);
        return court ? selectedSlots.length * court.pricePerHour : 0;
    }, [selectedSlots, selectedCourt, courts]);

    const handleBooking = async (paymentMethod) => {
        if (selectedSlots.length === 0 || !customerName || !customerPhone) {
            setBookingError('Por favor, completa tu nombre, teléfono y selecciona al menos un turno.');
            return;
        }

        setBookingError('');
        setLoading(true);

        const bookingData = {
            courtId: selectedCourt,
            user: { name: customerName, phone: customerPhone },
            startTime: selectedSlots[0],
            endTime: addHours(selectedSlots[selectedSlots.length - 1], 1),
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
                    payer: { name: customerName, email: "test_user@test.com" },
                    metadata: { booking_id_placeholder: bookingData }
                };
                const preference = await bookingService.createPaymentPreference(paymentData);
                window.location.href = preference.init_point;
            } else {
                const newBooking = await bookingService.createBooking(bookingData);
                alert(`¡Reserva confirmada! Tu reserva para el ${format(new Date(newBooking.startTime), 'dd/MM/yyyy HH:mm')} ha sido creada.`);
                const date = new Date(selectedDate + 'T00:00:00');
                const data = await bookingService.getAvailability(selectedCourt, date.toISOString());
                setBookedSlots(data);
                setCustomerName('');
                setCustomerPhone('');
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
                    <label htmlFor="court-select" className="block text-sm font-medium text-text-secondary mb-1">1. Elige una cancha</label>
                    <select id="court-select" value={selectedCourt} onChange={(e) => setSelectedCourt(e.target.value)} className="w-full bg-dark-primary border border-gray-600 rounded-md p-2 text-text-primary focus:ring-primary focus:border-primary" disabled={loading}>
                        {courts.map(court => (
                            <option key={court._id} value={court._id}>{court.name} ({court.courtType})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="date-select" className="block text-sm font-medium text-text-secondary mb-1">2. Elige una fecha</label>
                    <input type="date" id="date-select" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} min={format(new Date(), 'yyyy-MM-dd')} className="w-full bg-dark-primary border border-gray-600 rounded-md p-2 text-text-primary focus:ring-primary focus:border-primary" disabled={loading}/>
                </div>
            </div>

            <div className="mb-6">
                <h3 className="text-xl font-semibold text-text-primary mb-3">3. Elige tus turnos</h3>
                {loading && <p className="text-text-secondary">Cargando turnos...</p>}
                {!loading && availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                        {availableSlots.map(slot => (
                            <button key={slot.toISOString()} onClick={() => handleSlotClick(slot)} className={`p-2 rounded-md text-center font-semibold transition-colors ${selectedSlots.includes(slot) ? 'bg-primary text-white' : 'bg-dark-primary hover:bg-primary-dark'}`}>
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
                    <h3 className="text-lg font-bold text-primary mb-4">4. Completa tus datos y finaliza</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label htmlFor="customerName" className="block text-sm font-medium text-text-secondary">Nombre completo</label>
                            <input type="text" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" required />
                        </div>
                        <div>
                            <label htmlFor="customerPhone" className="block text-sm font-medium text-text-secondary">Teléfono (con código de país)</label>
                            <input type="tel" id="customerPhone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} className="w-full mt-1 bg-dark-secondary p-2 rounded-md border border-gray-600" required />
                        </div>
                    </div>
                    <p className="text-text-primary mt-2">
                        Turnos: {selectedSlots.map(s => format(s, 'HH:mm')).join(', ')}
                    </p>
                    <p className="text-2xl font-bold text-secondary mt-2">
                        Total: ${totalPrice.toFixed(2)}
                    </p>
                    {bookingError && <p className="text-danger text-sm mt-2">{bookingError}</p>}
                    <div className="flex flex-col sm:flex-row gap-4 mt-4">
                        <button onClick={() => handleBooking('Efectivo')} className="w-full bg-secondary hover:bg-opacity-80 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50" disabled={loading}>
                            {loading ? 'Procesando...' : 'Reservar (Pago en el club)'}
                        </button>
                        <button onClick={() => handleBooking('Mercado Pago')} className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50" disabled={loading}>
                            {loading ? 'Procesando...' : 'Pagar con Mercado Pago'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotFinder;