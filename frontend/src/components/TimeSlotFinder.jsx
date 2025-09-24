import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axiosInstance from '../config/axios';
import { format, addDays, subDays, startOfDay, endOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Sub-componentes ---
const TimeSlot = ({ slot, onSelect, isSelected, availability }) => {
    const getSlotClass = () => {
        if (slot.isPast) {
            return 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50';
        }
        if (isSelected) {
            return 'bg-secondary text-dark-primary ring-2 ring-white scale-105 shadow-lg';
        }
        switch (availability) {
            case 'available':
                return 'bg-green-500/20 text-green-300 hover:bg-green-500 hover:text-white';
            case 'partial':
                return 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500 hover:text-white';
            case 'full':
                return 'bg-red-900/50 text-red-300 cursor-not-allowed';
            default:
                return 'bg-dark-secondary text-text-primary hover:bg-primary hover:text-white';
        }
    };

    const getSlotTitle = () => {
        if (slot.isPast) return 'Turno ya pasado';
        switch (availability) {
            case 'available': return 'Turno disponible';
            case 'partial': return 'Parcialmente disponible';
            case 'full': return 'Turno no disponible';
            default: return 'Seleccionar turno';
        }
    };

    return (
        <button
            onClick={() => !slot.isPast && availability !== 'full' && onSelect(slot)}
            disabled={slot.isPast || availability === 'full'}
            className={`w-full p-3 rounded-lg text-center font-bold transition-all duration-200 ${getSlotClass()}`}
            title={getSlotTitle()}
        >
            {slot.time}
        </button>
    );
};

const AvailableCourt = ({ court, onBook }) => (
    <div className="bg-dark-primary p-4 rounded-lg flex justify-between items-center">
        <div>
            <p className="font-bold text-lg">{court.name}</p>
            <p className="text-sm text-text-secondary">{court.courtType} - ${court.pricePerHour / 2} por turno</p>
        </div>
        <button onClick={() => onBook(court)} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark">
            Reservar
        </button>
    </div>
);
// --- Fin de Sub-componentes ---

const TimeSlotFinder = () => {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [availableCourts, setAvailableCourts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const [dailyBookings, setDailyBookings] = useState([]);
    const [totalCourts, setTotalCourts] = useState(0);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingCourt, setBookingCourt] = useState(null);
    const [clientData, setClientData] = useState({ name: '', phone: '' });
    const [adminWpp, setAdminWpp] = useState('');
    const [preferenceId, setPreferenceId] = useState(null);
    const [mp, setMp] = useState(null);

    // Estado para manejar actualizaciones en tiempo real
    const [lastBookingUpdate, setLastBookingUpdate] = useState(Date.now());

    const timeSlots = useMemo(() => {
        const slots = [];
        const now = new Date();
        
        for (let i = 9; i <= 23; i++) {
            for (let j = 0; j < 60; j += 30) {
                if (i === 23 && j === 30) continue;

                const slotTime = new Date(selectedDate);
                slotTime.setHours(i, j, 0, 0);

                slots.push({
                    time: `${String(i).padStart(2, '0')}:${String(j).padStart(2, '0')}`,
                    hour: i,
                    minute: j,
                    isPast: isToday(selectedDate) && now > slotTime
                });
            }
        }
        return slots;
    }, [selectedDate]);

    const selectionSummary = useMemo(() => {
        if (selectedSlots.length === 0) {
            return null;
        }

        const firstSlot = selectedSlots[0];
        const lastSlot = selectedSlots[selectedSlots.length - 1];

        const startTime = firstSlot.time;

        const endTimeDate = new Date();
        endTimeDate.setHours(lastSlot.hour, lastSlot.minute + 30, 0, 0);
        const endTime = `${String(endTimeDate.getHours()).padStart(2, '0')}:${String(endTimeDate.getMinutes()).padStart(2, '0')}`;

        const durationMinutes = selectedSlots.length * 30;
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;

        let durationText = '';
        if (hours > 0) durationText += `${hours} hora${hours > 1 ? 's' : ''}`;
        if (minutes > 0) durationText += ` ${minutes} min`;

        return `Turno de ${startTime} a ${endTime} (${durationText.trim()})`;

    }, [selectedSlots]);

    const fetchDailyAvailability = useCallback(async (date, forceRefresh = false) => {
        // Solo mostrar loading si no es un refresh automático
        if (!forceRefresh) {
            setIsLoadingSlots(true);
        }
        setError('');

        try {
            const start = startOfDay(date);
            const end = endOfDay(date);

            console.log('🔄 Fetching data for date:', date.toISOString());

            const promises = [
                axiosInstance.get(`/bookings?start=${start.toISOString()}&end=${end.toISOString()}&_=${new Date().getTime()}`).catch(err => {
                    console.error('Error fetching bookings:', err);
                    return { data: [] };
                }),
                axiosInstance.get('/courts').catch(err => {
                    console.error('Error fetching courts:', err);
                    return { data: [] };
                }),
                axiosInstance.get('/settings').catch(err => {
                    console.error('Error fetching settings:', err);
                    return { data: {} };
                })
            ];

            const [bookingsRes, courtsRes, settingsRes] = await Promise.all(promises);

            setDailyBookings(bookingsRes.data);
            setTotalCourts(courtsRes.data.length);

            if (settingsRes.data.whatsappNumber) {
                setAdminWpp(settingsRes.data.whatsappNumber);
            }
            if (settingsRes.data.mercadoPagoPublicKey && !mp) {
                const mercadoPago = new window.MercadoPago(settingsRes.data.mercadoPagoPublicKey);
                setMp(mercadoPago);
            }

            // Actualizar timestamp para forzar recálculo de disponibilidad
            setLastBookingUpdate(Date.now());

        } catch (err) {
            console.error('Error en fetchDailyAvailability:', err);
            if (!forceRefresh) {
                setError('Error al cargar la disponibilidad del día. Verifica tu conexión.');
            }
        } finally {
            if (!forceRefresh) {
                setIsLoadingSlots(false);
            }
        }
    }, [mp]);

    useEffect(() => {
        fetchDailyAvailability(selectedDate);
    }, [selectedDate, fetchDailyAvailability]);

    const slotAvailability = useMemo(() => {
        const availability = {};
        timeSlots.forEach(slot => {
            const slotTime = new Date(selectedDate);
            slotTime.setHours(slot.hour, slot.minute, 0, 0);

            const bookingsInSlot = dailyBookings.filter(booking =>
                new Date(booking.startTime).getTime() === slotTime.getTime() && booking.status !== 'Cancelled'
            ).length;
            
            if (bookingsInSlot === 0) {
                availability[slot.time] = 'available';
            } else if (bookingsInSlot < totalCourts) {
                availability[slot.time] = 'partial';
            } else {
                availability[slot.time] = 'full';
            }
        });
        return availability;
    }, [dailyBookings, totalCourts, timeSlots, selectedDate, lastBookingUpdate]);
    
    const handleSelectSlot = (slot) => {
        setAvailableCourts([]);
        setError(''); // Limpiar errores previos

        setSelectedSlots(prevSlots => {
            const isSelected = prevSlots.some(s => s.time === slot.time);
            if (isSelected) {
                return prevSlots.filter(s => s.time !== slot.time);
            } else {
                return [...prevSlots, slot].sort((a,b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
            }
        });
    };
    
    const handleFindCourts = async () => {
        if (selectedSlots.length === 0) return;

        // Verificar disponibilidad actual antes de buscar
        await fetchDailyAvailability(selectedDate, true);

        // Verificar si algún slot seleccionado ya no está disponible
        const unavailableSlots = selectedSlots.filter(slot => !slotAvailability[slot.time]);

        if (unavailableSlots.length > 0) {
            setError(`Los siguientes horarios ya no están disponibles: ${unavailableSlots.map(s => s.time).join(', ')}`);
            // Remover slots no disponibles de la selección
            setSelectedSlots(prevSlots => prevSlots.filter(slot => slotAvailability[slot.time]));
            return;
        }

        setLoading(true);
        setError('');
        setAvailableCourts([]);

        try {
            const availabilityPromises = selectedSlots.map(slot => {
                const startTime = new Date(selectedDate);
                startTime.setHours(slot.hour, slot.minute, 0, 0);
                const endTime = new Date(startTime.getTime() + 30 * 60000);
                return axiosInstance.get(`/courts/available?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`);
            });

            const results = await Promise.all(availabilityPromises);

            if (results.some(res => res.data.length === 0)) {
                setError('No hay canchas disponibles para todos los horarios seleccionados');
                setAvailableCourts([]);
                return;
            }

            const courtIdLists = results.map(res => res.data.map(court => court._id));
            const commonCourtIds = courtIdLists.reduce((a, b) => a.filter(c => b.includes(c)));
            const finalAvailableCourts = results[0].data.filter(court => commonCourtIds.includes(court._id));

            setAvailableCourts(finalAvailableCourts);

            if (finalAvailableCourts.length === 0) {
                setError('No hay canchas disponibles para todos los horarios seleccionados');
            }

        } catch (err) {
            console.error('Error buscando canchas:', err);
            setError('Error al buscar canchas disponibles. Verifica tu conexión.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDateChange = (days) => {
        setSelectedDate(current => days > 0 ? addDays(current, 1) : subDays(current, 1));
        setSelectedSlots([]);
        setAvailableCourts([]);
        setError('');
    };
    
    const handleOpenBookingModal = (court) => {
        setBookingCourt(court);
        setIsModalOpen(true);
        setError('');
    };
    
    const handleClientDataChange = (e) => {
        setClientData({ ...clientData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const container = document.getElementById('wallet_container');
        if (container) {
            container.innerHTML = '';
        }

        if (preferenceId && mp) {
            const renderWallet = async () => {
                try {
                    const bricksBuilder = mp.bricks();
                    await bricksBuilder.create('wallet', 'wallet_container', {
                        initialization: {
                            preferenceId: preferenceId,
                        },
                        customization: {
                            texts: {
                                valueProp: 'smart_option',
                            },
                        },
                    });
                } catch (error) {
                    console.error('Error rendering Mercado Pago wallet:', error);
                }
            };
            renderWallet();
        }
    }, [preferenceId, mp]);

    const handleCreatePreference = async () => {
        if (!clientData.name || !clientData.phone) {
            alert("Por favor, completa tu nombre y teléfono.");
            return;
        }

        setIsSubmitting(true);
        const total = selectedSlots.length * (bookingCourt.pricePerHour / 2);

        const preferenceData = {
            courtId: bookingCourt._id,
            slots: selectedSlots,
            user: clientData,
            total: total,
            date: selectedDate
        };

        try {
            const response = await axiosInstance.post('/payments/create-preference', preferenceData);
            const { id, pending_id } = response.data;
            setPreferenceId(id);
        } catch (error) {
            console.error('Error creating preference:', error);

            if (error.response?.status === 409) {
                alert('Conflicto: Uno o más horarios ya fueron reservados por otro usuario. Actualizando disponibilidad...');
                // Refrescar la disponibilidad
                await fetchDailyAvailability(selectedDate, true);
                setIsModalOpen(false);
                setSelectedSlots([]);
                setAvailableCourts([]);
            } else {
                alert('Error al crear la preferencia de pago.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCashBooking = async () => {
        if (!clientData.name || !clientData.phone) {
            alert("Por favor, completa tu nombre y teléfono.");
            return;
        }

        setIsSubmitting(true);
        const cashBookingData = {
            courtId: bookingCourt._id,
            slots: selectedSlots,
            user: clientData,
            date: selectedDate,
            total: selectedSlots.length * (bookingCourt.pricePerHour / 2)
        };

        try {
            await axiosInstance.post('/bookings/cash', cashBookingData);
            alert('¡Reserva registrada exitosamente! Queda pendiente de pago en el local.');

            // Cerrar modal y limpiar estado
            setIsModalOpen(false);
            setSelectedSlots([]);
            setAvailableCourts([]);
            setClientData({ name: '', phone: '' });

            // Refrescar disponibilidad
            await fetchDailyAvailability(selectedDate, true);

        } catch (error) {
            console.error("Error creating cash booking:", error);

            if (error.response?.status === 409) {
                const message = error.response?.data?.message || 'Conflicto: Uno o más horarios ya fueron reservados.';
                alert(`${message}\n\nActualizando disponibilidad...`);

                // Refrescar disponibilidad para mostrar el estado actual
                await fetchDailyAvailability(selectedDate, true);

                // Cerrar modal y limpiar selección
                setIsModalOpen(false);
                setSelectedSlots([]);
                setAvailableCourts([]);

            } else {
                alert(error.response?.data?.message || 'Error al registrar la reserva.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setPreferenceId(null);
        setClientData({ name: '', phone: '' });
        setError('');
    };

    return (
        <div className="container mx-auto p-4 md:p-8">
            <main className="bg-dark-secondary p-6 rounded-xl shadow-lg mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <button onClick={() => handleDateChange(-1)} className="px-4 py-2 hover:bg-primary rounded-lg">&lt;</button>
                        <h2 className="text-xl font-bold text-white capitalize">
                            {format(selectedDate, 'eeee, dd MMMM yyyy', { locale: es })}
                        </h2>
                        <button onClick={() => handleDateChange(1)} className="px-4 py-2 hover:bg-primary rounded-lg">&gt;</button>
                    </div>
                    <p className="text-text-secondary text-center mb-4">1. Selecciona uno o más horarios</p>
                    {isLoadingSlots ? <p className='text-center'>Cargando horarios...</p> : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {timeSlots.map(slot => (
                                <TimeSlot 
                                    key={slot.time} 
                                    slot={slot}
                                    onSelect={handleSelectSlot} 
                                    isSelected={selectedSlots.some(s => s.time === slot.time)} 
                                    availability={slotAvailability[slot.time]}
                                />
                            ))}
                        </div>
                    )}

                    {/* Botón para refrescar manualmente */}
                    <div className="text-center mt-4">
                        <button
                            onClick={() => fetchDailyAvailability(selectedDate, true)}
                            className="text-text-secondary hover:text-white text-sm px-3 py-1 rounded transition"
                            disabled={isLoadingSlots}
                        >
                            🔄 Actualizar disponibilidad
                        </button>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-4 text-center">Disponibilidad</h3>
                    <p className="text-text-secondary text-center mb-4">2. Busca y elige una cancha</p>

                    {selectionSummary && (
                        <div className="bg-dark-primary text-center p-3 rounded-lg mb-4 animate-fade-in">
                            <p className="font-bold text-secondary">{selectionSummary}</p>
                        </div>
                    )}

                    <button 
                        onClick={handleFindCourts}
                        disabled={selectedSlots.length === 0 || loading}
                        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-500 disabled:cursor-not-allowed mb-4"
                    >
                        {loading ? 'Buscando...' : `Buscar Canchas para ${selectedSlots.length} Turnos`}
                    </button>

                    {error && <div className="bg-red-600/20 border border-red-600 text-red-400 px-4 py-3 rounded mb-4">{error}</div>}

                    <div className="space-y-4">
                        {availableCourts.length > 0 && (
                            <div className='animate-fade-in'>
                                <p className='text-center text-secondary mb-2 font-bold'>Canchas disponibles para todos los horarios:</p>
                                {availableCourts.map(court => (
                                    <AvailableCourt key={court._id} court={court} onBook={handleOpenBookingModal} />
                                ))}
                            </div>
                        )}
                        {!loading && availableCourts.length === 0 && selectedSlots.length > 0 && !error && (
                             <p className="text-center text-text-secondary p-4">
                                Presiona "Buscar" para ver la disponibilidad.
                             </p>
                        )}
                    </div>
                </div>
            </main>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-secondary p-8 rounded-lg max-w-sm w-full">
                        {!preferenceId ? (
                            <form onSubmit={(e) => { e.preventDefault(); handleCreatePreference(); }} >
                                <h3 className="text-2xl font-bold mb-2">Confirmar Reserva</h3>
                                <p className="text-text-primary mb-2">
                                    Cancha: <span className='font-bold text-secondary'>{bookingCourt?.name}</span>
                                </p>
                                <p className="text-text-primary mb-4">
                                    Horarios: <span className='font-bold text-secondary'>{selectedSlots.map(s => s.time).join(', ')}hs</span>
                                </p>
                                <p className="text-text-secondary mb-4">Por favor, déjanos tus datos para finalizar.</p>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="clientName" className="text-sm text-text-secondary">Nombre Completo</label>
                                        <input type="text" id="clientName" name="name" autoComplete="name" value={clientData.name} onChange={handleClientDataChange} className="w-full mt-1 p-2 text-black" required />
                                    </div>
                                    <div>
                                        <label htmlFor="clientPhone" className="text-sm text-text-secondary">Teléfono</label>
                                        <input type="tel" id="clientPhone" name="phone" autoComplete="tel" value={clientData.phone} onChange={handleClientDataChange} className="w-full mt-1 p-2 text-black" required />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark disabled:bg-gray-500"
                                        >
                                            {isSubmitting ? 'Procesando...' : 'Pagar con Mercado Pago'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCashBooking}
                                            disabled={isSubmitting}
                                            className="w-full bg-secondary text-dark-primary font-bold py-3 rounded-lg hover:opacity-80 transition disabled:bg-gray-500"
                                        >
                                            {isSubmitting ? 'Procesando...' : 'Confirmar (Pago en Efectivo)'}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                        className="w-full bg-gray-600 py-2 rounded-lg mt-2 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div id="wallet_container"></div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotFinder;