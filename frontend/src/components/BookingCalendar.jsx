import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { socket } from './NotificationProvider';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, isSameMonth } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Componente para una celda del calendario ---
const CalendarCell = ({ day, onDateClick, isSelected, isCurrentMonth }) => {
    const cellClasses = `h-12 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
        isSelected ? 'bg-primary text-white font-bold ring-2 ring-offset-2 ring-offset-dark-secondary ring-primary' : 
        isToday(day) ? 'bg-secondary text-dark-primary font-bold' : 
        isCurrentMonth ? 'hover:bg-dark-primary' : 'text-gray-500 hover:bg-dark-primary'
    }`;
    return (
        <div className={cellClasses} onClick={() => onDateClick(day)}>
            {format(day, 'd')}
        </div>
    );
};


// --- Componente para un solo turno (slot) ---
const TimeSlot = ({ slot, onSelect, isBooked, isSelected }) => {
    let baseClasses = "w-full p-3 rounded-lg text-center font-bold transition-transform transform hover:scale-105 ";
    let statusClasses = "bg-dark-secondary text-text-primary hover:bg-primary hover:text-white cursor-pointer";
    
    if (isBooked) {
        statusClasses = "bg-danger text-white cursor-not-allowed opacity-60";
    } else if (isSelected) {
        statusClasses = "bg-secondary text-dark-primary ring-2 ring-white";
    }

    return (
        <button
            onClick={() => !isBooked && onSelect(slot)}
            disabled={isBooked}
            className={baseClasses + statusClasses}
        >
            {slot.time}
        </button>
    );
};

const BookingCalendar = () => {
    const [courts, setCourts] = useState([]);
    const [selectedCourtId, setSelectedCourtId] = useState('');
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [clientData, setClientData] = useState({ name: '', phone: '' });
    const [adminWpp, setAdminWpp] = useState('');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const courtsRes = await axios.get('/courts');
                if (courtsRes.data.length > 0) {
                    setCourts(courtsRes.data);
                    setSelectedCourtId(courtsRes.data[0]._id);
                }
                const settingsRes = await axios.get('/settings');
                if (settingsRes.data.whatsappNumber) {
                    setAdminWpp(settingsRes.data.whatsappNumber);
                }
            } catch (err) {
                setError("Error al cargar datos iniciales.");
            }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (!selectedCourtId) return;

        const fetchBookingsForDate = async (date) => {
            setLoadingSlots(true);
            const startOfDay = new Date(date); startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date); endOfDay.setHours(23, 59, 59, 999);
            try {
                const res = await axios.get(`/bookings?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
                setBookings(res.data.filter(b => b.court._id === selectedCourtId));
            } catch (err) {
                setError("Error al cargar las reservas.");
            } finally {
                setLoadingSlots(false);
            }
        };

        fetchBookingsForDate(selectedDate);
        
        const handleBookingUpdate = () => fetchBookingsForDate(selectedDate);
        socket.on('booking_update', handleBookingUpdate);
        socket.on('booking_deleted', handleBookingUpdate);
        
        return () => {
            socket.off('booking_update', handleBookingUpdate);
            socket.off('booking_deleted', handleBookingUpdate);
        };
    }, [selectedDate, selectedCourtId]);

    useEffect(() => {
        setSelectedSlots([]);
    }, [selectedDate, selectedCourtId]);

    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(currentMonth);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: startDate, end: endDate });
    }, [currentMonth]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 9; i <= 23; i++) {
            slots.push({ time: `${i}:00`, hour: i, minute: 0 });
            if (i < 23) {
                slots.push({ time: `${i}:30`, hour: i, minute: 30 });
            }
        }
        return slots;
    }, []);

    const handleSelectSlot = (slot) => {
        setSelectedSlots(prevSlots => {
            const isAlreadySelected = prevSlots.some(s => s.hour === slot.hour && s.minute === slot.minute);
            if (isAlreadySelected) {
                return prevSlots.filter(s => !(s.hour === slot.hour && s.minute === slot.minute));
            } else {
                return [...prevSlots, slot];
            }
        });
    };
    
    const handleOpenConfirmationModal = () => {
        if (selectedSlots.length > 0) setIsModalOpen(true);
    };

    const handleClientDataChange = (e) => {
        setClientData({ ...clientData, [e.target.name]: e.target.value });
    };

    const handleConfirmReservations = async () => {
        if (!clientData.name || !clientData.phone) {
            alert("Por favor, completa tu nombre y teléfono.");
            return;
        }

        const court = courts.find(c => c._id === selectedCourtId);
        setLoadingSlots(true);

        const promises = selectedSlots.map(slot => {
            const startTime = new Date(selectedDate);
            startTime.setHours(slot.hour, slot.minute, 0, 0);
            const endTime = new Date(startTime.getTime() + 30 * 60000);

            return axios.post('/bookings', {
                court: court._id,
                startTime,
                endTime,
                user: { name: clientData.name, phone: clientData.phone },
                status: 'Confirmed'
            });
        });

        try {
            await Promise.all(promises);

            if (adminWpp) {
                const turnos = selectedSlots.map(s => s.time).sort((a,b) => a.localeCompare(b, undefined, { numeric: true })).join(', ');
                const message = `¡Nueva reserva!\n\n*Cancha:* ${court.name}\n*Día:* ${format(selectedDate, 'eeee dd/MM/yyyy', {locale: es})}\n*Horarios:* ${turnos}hs\n\n*Cliente:* ${clientData.name}\n*Teléfono:* ${clientData.phone}`;
                const cleanPhone = adminWpp.replace(/[^0-9]/g, '');
                const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            }
            alert('¡Reservas confirmadas con éxito!');
            setIsModalOpen(false);
            setClientData({ name: '', phone: '' });
            setSelectedSlots([]);
        } catch (error) {
            alert(error.response?.data?.message || 'Error al crear una o más reservas. Es posible que algún turno haya sido tomado.');
        } finally {
             const newDate = new Date(selectedDate);
             setSelectedDate(newDate);
        }
    };
    
    const changeMonth = (amount) => {
        setCurrentMonth(prevMonth => amount > 0 ? addMonths(prevMonth, 1) : subMonths(prevMonth, 1));
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-dark-secondary p-4 rounded-lg mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <button onClick={() => changeMonth(-1)} className="px-4 py-2 hover:bg-primary rounded-lg">&lt;</button>
                            <h3 className="text-xl font-bold text-white capitalize">
                                {format(currentMonth, 'MMMM yyyy', { locale: es })}
                            </h3>
                            <button onClick={() => changeMonth(1)} className="px-4 py-2 hover:bg-primary rounded-lg">&gt;</button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-xs text-text-secondary mb-2">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => <div key={day}>{day}</div>)}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(day => (
                                <CalendarCell key={day.toString()} day={day} onDateClick={setSelectedDate} isSelected={isSameDay(day, selectedDate)} isCurrentMonth={isSameMonth(day, currentMonth)} />
                            ))}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-text-primary mb-4">
                        Turnos para {format(selectedDate, "eeee dd 'de' MMMM", { locale: es })}
                    </h3>
                    
                    {error && <p className="text-danger mb-4 text-center">{error}</p>}
                    
                    {loadingSlots ? <div className="text-center p-8">Cargando turnos...</div> : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {timeSlots.map(slot => {
                                const slotStartTime = new Date(selectedDate); slotStartTime.setHours(slot.hour, slot.minute, 0, 0);
                                const booking = bookings.find(b => new Date(b.startTime).getTime() === slotStartTime.getTime());
                                const isSelected = selectedSlots.some(s => s.hour === slot.hour && s.minute === slot.minute);
                                
                                return (
                                    <TimeSlot key={slot.time} slot={slot} onSelect={handleSelectSlot} isBooked={!!booking} isSelected={isSelected} />
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-dark-secondary p-6 rounded-lg sticky top-24">
                        <h3 className="text-xl font-bold text-white mb-2">Cancha Seleccionada</h3>
                         <select value={selectedCourtId} onChange={e => setSelectedCourtId(e.target.value)} className="w-full p-2 mb-4 bg-dark-primary rounded-lg text-lg">
                            {courts.map(court => (
                                <option key={court._id} value={court._id}>{court.name}</option>
                            ))}
                        </select>
                        <h3 className="text-xl font-bold text-white mb-4">Turnos a Reservar</h3>
                        {selectedSlots.length > 0 ? (
                            <div className="space-y-2">
                                {selectedSlots.sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute)).map(slot => (
                                    <div key={`${slot.hour}:${slot.minute}`} className="flex justify-between items-center bg-dark-primary p-3 rounded">
                                        <span className="font-bold">{slot.time} hs</span>
                                        <span className="text-secondary">${(courts.find(c => c._id === selectedCourtId)?.pricePerHour || 0) / 2}</span>
                                    </div>
                                ))}
                                <div className="border-t border-gray-600 pt-4 mt-4 space-y-2">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>TOTAL:</span>
                                        <span>${selectedSlots.length * ((courts.find(c => c._id === selectedCourtId)?.pricePerHour || 0) / 2)}</span>
                                    </div>
                                    <button onClick={handleOpenConfirmationModal} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition">
                                        Reservar {selectedSlots.length} Turno(s)
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <p className="text-text-secondary text-sm">Haz clic en los turnos disponibles para agregarlos aquí.</p>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <form onSubmit={(e) => { e.preventDefault(); handleConfirmReservations(); }} className="bg-dark-secondary p-8 rounded-lg max-w-sm w-full">
                        <h3 className="text-2xl font-bold mb-4">Confirmar Reserva</h3>
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
                                Confirmar y Enviar a WhatsApp
                            </button>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="w-full bg-gray-600 py-2 rounded-lg mt-2">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

export default BookingCalendar;