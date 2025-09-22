import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, addDays, subDays, startOfDay, endOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Sub-componentes ---
const TimeSlot = ({ slot, onSelect, isSelected, isAvailable, isPast }) => (
    <button
        onClick={() => isAvailable && !isPast && onSelect(slot)}
        disabled={!isAvailable || isPast}
        className={`w-full p-3 rounded-lg text-center font-bold transition-transform transform ${
            isSelected 
                ? 'bg-secondary text-dark-primary ring-2 ring-white scale-105' 
                : isPast
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed' // Estilo para turnos pasados
                    : isAvailable
                        ? 'bg-dark-secondary text-text-primary hover:bg-primary hover:text-white hover:scale-105'
                        : 'bg-danger/50 text-text-secondary cursor-not-allowed opacity-70'
        }`}
    >
        {slot.time}
    </button>
);

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
    const [bookingCourt, setBookingCourt] = useState(null);
    const [clientData, setClientData] = useState({ name: '', phone: '' });
    const [adminWpp, setAdminWpp] = useState('');
    const [preferenceId, setPreferenceId] = useState(null);
    const [mp, setMp] = useState(null);

    const timeSlots = useMemo(() => {
        const slots = [];
        const now = new Date(); // Obtenemos la fecha y hora actual
        
        for (let i = 9; i <= 23; i++) {
            for (let j = 0; j < 60; j += 30) {
                if (i === 23 && j === 30) continue; // No agregar 23:30 si el límite es 23:00

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
    }, [selectedDate]); // Se recalcula cuando cambia el día

    const fetchDailyAvailability = useCallback(async (date) => {
        setIsLoadingSlots(true);
        setError('');
        try {
            const start = startOfDay(date);
            const end = endOfDay(date);

            const [bookingsRes, courtsRes, settingsRes] = await Promise.all([
                axios.get(`/bookings?start=${start.toISOString()}&end=${end.toISOString()}`),
                axios.get('/courts'),
                axios.get('/settings')
            ]);
            
            setDailyBookings(bookingsRes.data);
            setTotalCourts(courtsRes.data.length);
             if (settingsRes.data.whatsappNumber) {
                setAdminWpp(settingsRes.data.whatsappNumber);
            }
            if (settingsRes.data.mercadoPagoPublicKey) {
                const mp = new window.MercadoPago(settingsRes.data.mercadoPagoPublicKey);
                setMp(mp);
            }

        } catch (err) {
            setError('Error al cargar la disponibilidad del día.');
        } finally {
            setIsLoadingSlots(false);
        }
    }, []);

    useEffect(() => {
        fetchDailyAvailability(selectedDate);
    }, [selectedDate, fetchDailyAvailability]);

    const slotAvailability = useMemo(() => {
        const availability = {};
        timeSlots.forEach(slot => {
            const slotTime = new Date(selectedDate);
            slotTime.setHours(slot.hour, slot.minute, 0, 0);

            const bookingsInSlot = dailyBookings.filter(booking => 
                new Date(booking.startTime).getTime() === slotTime.getTime()
            ).length;
            
            availability[slot.time] = bookingsInSlot < totalCourts;
        });
        return availability;
    }, [dailyBookings, totalCourts, timeSlots, selectedDate]);
    
    const handleSelectSlot = (slot) => {
        setAvailableCourts([]); 
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
        setLoading(true);
        setError('');
        setAvailableCourts([]);
        try {
            const availabilityPromises = selectedSlots.map(slot => {
                const startTime = new Date(selectedDate);
                startTime.setHours(slot.hour, slot.minute, 0, 0);
                const endTime = new Date(startTime.getTime() + 30 * 60000);
                return axios.get(`/courts/available?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`);
            });
            const results = await Promise.all(availabilityPromises);
            if (results.some(res => res.data.length === 0)) {
                setAvailableCourts([]);
                return;
            }
            const courtIdLists = results.map(res => res.data.map(court => court._id));
            const commonCourtIds = courtIdLists.reduce((a, b) => a.filter(c => b.includes(c)));
            const finalAvailableCourts = results[0].data.filter(court => commonCourtIds.includes(court._id));
            setAvailableCourts(finalAvailableCourts);
        } catch (err) {
            setError('Error al buscar canchas disponibles.');
        } finally {
            setLoading(false);
        }
    };
    
    const handleDateChange = (days) => {
        setSelectedDate(current => days > 0 ? addDays(current, 1) : subDays(current, 1));
        setSelectedSlots([]);
        setAvailableCourts([]);
    };
    
    const handleOpenBookingModal = (court) => {
        setBookingCourt(court);
        setIsModalOpen(true);
    };
    
     const handleClientDataChange = (e) => {
        setClientData({ ...clientData, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        if (preferenceId && mp) {
            mp.wallet({
                initialization: {
                    preferenceId: preferenceId,
                },
                render: {
                    container: '#wallet_container',
                    label: 'Pagar',
                }
            });
        }
    }, [preferenceId, mp]);

    const handleCreatePreference = async () => {
        if (!clientData.name || !clientData.phone) {
            alert("Por favor, completa tu nombre y teléfono.");
            return;
        }

        const total = selectedSlots.length * (bookingCourt.pricePerHour / 2);

        const preferenceData = {
            courtId: bookingCourt._id,
            slots: selectedSlots,
            user: clientData,
            total: total,
            date: selectedDate
        };

        try {
            const response = await axios.post('/payments/create-preference', preferenceData);
            const { id, pending_id } = response.data;
            setPreferenceId(id);
            localStorage.setItem('pendingPaymentId', pending_id);
        } catch (error) {
            console.log(error);
            alert('Error al crear la preferencia de pago.');
        }
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
                                    isAvailable={slotAvailability[slot.time]}
                                    isPast={slot.isPast}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-xl font-bold text-white mb-4 text-center">Disponibilidad</h3>
                     <p className="text-text-secondary text-center mb-4">2. Busca y elige una cancha</p>
                    <button 
                        onClick={handleFindCourts}
                        disabled={selectedSlots.length === 0 || loading}
                        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-500 disabled:cursor-not-allowed mb-4"
                    >
                        {loading ? 'Buscando...' : `Buscar Canchas para ${selectedSlots.length} Turnos`}
                    </button>
                    {error && <p className="text-danger text-center">{error}</p>}
                    <div className="space-y-4">
                        {availableCourts.length > 0 && (
                            <div className='animate-fade-in'>
                                <p className='text-center text-secondary mb-2 font-bold'>Canchas disponibles para todos los horarios:</p>
                                {availableCourts.map(court => (
                                    <AvailableCourt key={court._id} court={court} onBook={handleOpenBookingModal} />
                                ))}
                            </div>
                        )}
                        {!loading && availableCourts.length === 0 && selectedSlots.length > 0 && (
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
                                        <input type="text" id="clientName" name="name" autoComplete="name" value={clientData.name} onChange={handleClientDataChange} className="w-full mt-1 p-2" required />
                                    </div>
                                    <div>
                                        <label htmlFor="clientPhone" className="text-sm text-text-secondary">Teléfono</label>
                                        <input type="tel" id="clientPhone" name="phone" autoComplete="tel" value={clientData.phone} onChange={handleClientDataChange} className="w-full mt-1 p-2" required />
                                    </div>
                                    <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark">
                                        Pagar con Mercado Pago
                                    </button>
                                    <button type="button" onClick={() => {setIsModalOpen(false); setPreferenceId(null);}} className="w-full bg-gray-600 py-2 rounded-lg mt-2">
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