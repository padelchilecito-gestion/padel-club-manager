import React, { useState, useMemo, useEffect, useCallback } from 'react';
import axiosInstance from '../config/axios';
import { format, addDays, subDays, startOfDay, endOfDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';

// --- Sub-componentes ---
const TimeSlot = ({ slot, onSelect, isSelected, isAvailable, isPast }) => (
    <button
        onClick={() => isAvailable && !isPast && onSelect(slot)}
        disabled={!isAvailable || isPast}
        className={`w-full p-3 rounded-lg text-center font-bold transition-all duration-200 ${
            isSelected 
                ? 'bg-secondary text-dark-primary ring-2 ring-white scale-105 shadow-lg'
                : isPast
                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed opacity-50'
                    : isAvailable
                        ? 'bg-dark-secondary text-text-primary hover:bg-primary hover:text-white hover:scale-105 shadow-md'
                        : 'bg-red-900/50 text-red-300 cursor-not-allowed opacity-70'
        }`}
        title={
            !isAvailable ? 'Turno no disponible' :
            isPast ? 'Turno ya pasado' :
            'Turno disponible'
        }
    >
        {slot.time}
    </button>
);

const AvailableCourt = ({ court, onBook, totalPrice }) => (
    <div className="bg-dark-primary p-4 rounded-lg flex justify-between items-center shadow-md hover:shadow-lg transition-shadow">
        <div>
            <p className="font-bold text-lg text-white">{court.name}</p>
            <p className="text-sm text-text-secondary">
                {court.courtType} - ${court.pricePerHour / 2} por turno
            </p>
            <p className="text-secondary font-bold">Total: ${totalPrice}</p>
        </div>
        <button
            onClick={() => onBook(court)}
            className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-colors"
        >
            Reservar
        </button>
    </div>
);

const LoadingSpinner = ({ message = "Cargando..." }) => (
    <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mr-3"></div>
        <span className="text-text-secondary">{message}</span>
    </div>
);

const ErrorAlert = ({ message, onRetry }) => (
    <div className="bg-red-900/20 border border-red-600 text-red-300 px-4 py-3 rounded-lg mb-4">
        <p>{message}</p>
        {onRetry && (
            <button
                onClick={onRetry}
                className="mt-2 text-sm underline hover:no-underline"
            >
                Reintentar
            </button>
        )}
    </div>
);

// --- Componente Principal ---
const TimeSlotFinder = () => {
    // Estados principales
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedSlots, setSelectedSlots] = useState([]);
    const [availableCourts, setAvailableCourts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Estados de disponibilidad
    const [dailyBookings, setDailyBookings] = useState([]);
    const [totalCourts, setTotalCourts] = useState(0);
    const [isLoadingSlots, setIsLoadingSlots] = useState(true);

    // Estados del modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingCourt, setBookingCourt] = useState(null);
    const [clientData, setClientData] = useState({ name: '', phone: '' });

    // Estados de configuración
    const [adminWpp, setAdminWpp] = useState('');
    const [preferenceId, setPreferenceId] = useState(null);
    const [mp, setMp] = useState(null);

    // Estados de control
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    const [retryCount, setRetryCount] = useState(0);

    // Generar slots de tiempo
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

    // Calcular resumen de selección
    const selectionSummary = useMemo(() => {
        if (selectedSlots.length === 0) return null;

        const sortedSlots = [...selectedSlots].sort((a, b) =>
            (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute)
        );

        const firstSlot = sortedSlots[0];
        const lastSlot = sortedSlots[sortedSlots.length - 1];

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

    // Función para obtener disponibilidad del día
    const fetchDailyAvailability = useCallback(async (date, isRetry = false) => {
        if (!isRetry) {
            setIsLoadingSlots(true);
            setError('');
        }

        try {
            const start = startOfDay(date);
            const end = endOfDay(date);
            const timestamp = new Date().getTime();

            // Solicitudes paralelas con manejo de errores individual
            const [bookingsRes, courtsRes, settingsRes] = await Promise.allSettled([
                axiosInstance.get(`/bookings?start=${start.toISOString()}&end=${end.toISOString()}&_=${timestamp}`),
                axiosInstance.get('/courts'),
                axiosInstance.get('/settings')
            ]);

            // Procesar respuesta de bookings
            if (bookingsRes.status === 'fulfilled') {
                setDailyBookings(bookingsRes.value.data);
            } else {
                console.error('Error fetching bookings:', bookingsRes.reason);
                setDailyBookings([]);
            }

            // Procesar respuesta de courts
            if (courtsRes.status === 'fulfilled') {
                setTotalCourts(courtsRes.value.data.length);
            } else {
                console.error('Error fetching courts:', courtsRes.reason);
                setTotalCourts(0);
            }

            // Procesar respuesta de settings
            if (settingsRes.status === 'fulfilled') {
                const settings = settingsRes.value.data;
                if (settings.whatsappNumber) {
                    setAdminWpp(settings.whatsappNumber);
                }
                if (settings.mercadoPagoPublicKey && !mp) {
                    try {
                        const mercadoPago = new window.MercadoPago(settings.mercadoPagoPublicKey);
                        setMp(mercadoPago);
                    } catch (mpError) {
                        console.error('Error initializing MercadoPago:', mpError);
                    }
                }
            }

            setLastUpdate(Date.now());
            setRetryCount(0);

        } catch (err) {
            console.error('Error in fetchDailyAvailability:', err);
            if (!isRetry) {
                setError('Error al cargar la disponibilidad. Por favor, intenta nuevamente.');
                setRetryCount(prev => prev + 1);
            }
        } finally {
            if (!isRetry) {
                setIsLoadingSlots(false);
            }
        }
    }, [mp]);

    // Efecto para cargar datos iniciales
    useEffect(() => {
        fetchDailyAvailability(selectedDate);
    }, [selectedDate, fetchDailyAvailability]);

    // Calcular disponibilidad de slots
    const slotAvailability = useMemo(() => {
        const availability = {};

        timeSlots.forEach(slot => {
            const slotTime = new Date(selectedDate);
            slotTime.setHours(slot.hour, slot.minute, 0, 0);

            const bookingsInSlot = dailyBookings.filter(booking => {
                const bookingStart = new Date(booking.startTime);
                return bookingStart.getTime() === slotTime.getTime();
            }).length;
            
            availability[slot.time] = bookingsInSlot < totalCourts;
        });

        return availability;
    }, [dailyBookings, totalCourts, timeSlots, selectedDate, lastUpdate]);
    
    // Manejar selección de slots
    const handleSelectSlot = useCallback((slot) => {
        setAvailableCourts([]);
        setError('');

        setSelectedSlots(prevSlots => {
            const isSelected = prevSlots.some(s => s.time === slot.time);
            if (isSelected) {
                return prevSlots.filter(s => s.time !== slot.time);
            } else {
                const newSlots = [...prevSlots, slot];
                return newSlots.sort((a, b) => (a.hour * 60 + a.minute) - (b.hour * 60 + b.minute));
            }
        });
    }, []);
    
    // Buscar canchas disponibles
    const handleFindCourts = async () => {
        if (selectedSlots.length === 0) {
            setError('Por favor selecciona al menos un horario.');
            return;
        }

        setLoading(true);
        setError('');
        setAvailableCourts([]);

        try {
            // Verificar disponibilidad actual
            await fetchDailyAvailability(selectedDate, true);

            // Verificar que los slots sigan disponibles
            const unavailableSlots = selectedSlots.filter(slot => !slotAvailability[slot.time]);

            if (unavailableSlots.length > 0) {
                setError(`Los siguientes horarios ya no están disponibles: ${unavailableSlots.map(s => s.time).join(', ')}`);
                setSelectedSlots(prevSlots => prevSlots.filter(slot => slotAvailability[slot.time]));
                return;
            }

            // Buscar canchas disponibles para cada slot
            const availabilityPromises = selectedSlots.map(slot => {
                const startTime = new Date(selectedDate);
                startTime.setHours(slot.hour, slot.minute, 0, 0);
                const endTime = new Date(startTime.getTime() + 30 * 60000);
                return axiosInstance.get(`/courts/available?startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`);
            });

            const results = await Promise.all(availabilityPromises);

            // Verificar que hay canchas disponibles para todos los slots
            if (results.some(res => res.data.length === 0)) {
                setError('No hay canchas disponibles para todos los horarios seleccionados');
                return;
            }

            // Encontrar canchas comunes a todos los slots
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
    
    // Manejar cambio de fecha
    const handleDateChange = (days) => {
        const newDate = days > 0 ? addDays(selectedDate, 1) : subDays(selectedDate, 1);
        setSelectedDate(newDate);
        setSelectedSlots([]);
        setAvailableCourts([]);
        setError('');
    };
    
    // Abrir modal de reserva
    const handleOpenBookingModal = (court) => {
        setBookingCourt(court);
        setIsModalOpen(true);
        setError('');
        setPreferenceId(null);
    };
    
    // Manejar cambios en datos del cliente
    const handleClientDataChange = (e) => {
        const { name, value } = e.target;
        setClientData(prev => ({ ...prev, [name]: value.trim() }));
    };

    // Validar datos del cliente
    const validateClientData = () => {
        if (!clientData.name || clientData.name.length < 2) {
            setError('El nombre debe tener al menos 2 caracteres.');
            return false;
        }
        if (!clientData.phone || clientData.phone.length < 8) {
            setError('El teléfono debe tener al menos 8 dígitos.');
            return false;
        }
        return true;
    };

    // Efecto para renderizar wallet de MercadoPago
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
                    setError('Error al cargar el método de pago. Intenta nuevamente.');
                }
            };
            renderWallet();
        }
    }, [preferenceId, mp]);

    // Crear preferencia de pago
    const handleCreatePreference = async () => {
        if (!validateClientData()) return;

        setIsSubmitting(true);
        setError('');

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
            const { id } = response.data;
            setPreferenceId(id);
        } catch (error) {
            console.error('Error creating preference:', error);

            if (error.response?.status === 409) {
                setError('Conflicto: Uno o más horarios ya fueron reservados por otro usuario.');
                setTimeout(() => {
                    fetchDailyAvailability(selectedDate, true);
                    closeModal();
                    setSelectedSlots([]);
                    setAvailableCourts([]);
                }, 2000);
            } else {
                setError(error.response?.data?.message || 'Error al crear la preferencia de pago.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Crear reserva con pago en efectivo
    const handleCashBooking = async () => {
        if (!validateClientData()) return;

        setIsSubmitting(true);
        setError('');

        const cashBookingData = {
            courtId: bookingCourt._id,
            slots: selectedSlots,
            user: clientData,
            date: selectedDate,
            total: selectedSlots.length * (bookingCourt.pricePerHour / 2)
        };

        try {
            const response = await axiosInstance.post('/bookings/cash', cashBookingData);

            // Mostrar mensaje de éxito
            alert('¡Reserva registrada exitosamente! Queda pendiente de pago en el local.');

            // Limpiar estado
            closeModal();
            setSelectedSlots([]);
            setAvailableCourts([]);

            // Refrescar disponibilidad
            await fetchDailyAvailability(selectedDate, true);

        } catch (error) {
            console.error("Error creating cash booking:", error);

            if (error.response?.status === 409) {
                setError('Conflicto: Uno o más horarios ya fueron reservados por otro usuario.');
                setTimeout(() => {
                    fetchDailyAvailability(selectedDate, true);
                    closeModal();
                    setSelectedSlots([]);
                    setAvailableCourts([]);
                }, 2000);
            } else {
                setError(error.response?.data?.message || 'Error al registrar la reserva.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Cerrar modal
    const closeModal = () => {
        setIsModalOpen(false);
        setPreferenceId(null);
        setClientData({ name: '', phone: '' });
        setError('');
    };

    // Calcular precio total
    const totalPrice = selectedSlots.length * (bookingCourt?.pricePerHour / 2 || 0);

    return (
        <div className="container mx-auto p-4 md:p-8">
            <main className="bg-dark-secondary p-6 rounded-xl shadow-lg mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel de selección de horarios */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={() => handleDateChange(-1)}
                            className="px-4 py-2 hover:bg-primary rounded-lg transition-colors"
                        >
                            ←
                        </button>
                        <h2 className="text-xl font-bold text-white capitalize text-center">
                            {format(selectedDate, 'eeee, dd MMMM yyyy', { locale: es })}
                        </h2>
                        <button
                            onClick={() => handleDateChange(1)}
                            className="px-4 py-2 hover:bg-primary rounded-lg transition-colors"
                        >
                            →
                        </button>
                    </div>

                    <p className="text-text-secondary text-center mb-4">
                        1. Selecciona uno o más horarios
                    </p>

                    {isLoadingSlots ? (
                        <LoadingSpinner message="Cargando horarios..." />
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

                    {/* Botón de actualización */}
                    <div className="text-center mt-4">
                        <button
                            onClick={() => fetchDailyAvailability(selectedDate, true)}
                            className="text-text-secondary hover:text-white text-sm px-3 py-1 rounded transition-colors"
                            disabled={isLoadingSlots}
                        >
                            🔄 Actualizar disponibilidad
                        </button>
                        {retryCount > 0 && (
                            <p className="text-xs text-orange-400 mt-1">
                                Intentos de reconexión: {retryCount}
                            </p>
                        )}
                    </div>
                </div>

                {/* Panel de disponibilidad y reserva */}
                <div>
                    <h3 className="text-xl font-bold text-white mb-4 text-center">
                        Disponibilidad
                    </h3>
                    <p className="text-text-secondary text-center mb-4">
                        2. Busca y elige una cancha
                    </p>

                    {/* Resumen de selección */}
                    {selectionSummary && (
                        <div className="bg-dark-primary text-center p-4 rounded-lg mb-4 border border-secondary/20">
                            <p className="font-bold text-secondary">{selectionSummary}</p>
                            <p className="text-sm text-text-secondary mt-1">
                                {selectedSlots.length} turno{selectedSlots.length > 1 ? 's' : ''} seleccionado{selectedSlots.length > 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {/* Botón de búsqueda */}
                    <button 
                        onClick={handleFindCourts}
                        disabled={selectedSlots.length === 0 || loading || isLoadingSlots}
                        className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed mb-4"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Buscando...
                            </span>
                        ) : (
                            `Buscar Canchas ${selectedSlots.length > 0 ? `(${selectedSlots.length} turnos)` : ''}`
                        )}
                    </button>

                    {/* Mostrar errores */}
                    {error && (
                        <ErrorAlert
                            message={error}
                            onRetry={error.includes('conexión') ? () => fetchDailyAvailability(selectedDate) : null}
                        />
                    )}

                    {/* Lista de canchas disponibles */}
                    <div className="space-y-4">
                        {availableCourts.length > 0 && (
                            <div className="animate-fade-in">
                                <p className="text-center text-secondary mb-3 font-bold">
                                    Canchas disponibles para todos los horarios:
                                </p>
                                {availableCourts.map(court => (
                                    <AvailableCourt
                                        key={court._id}
                                        court={court}
                                        onBook={handleOpenBookingModal}
                                        totalPrice={selectedSlots.length * (court.pricePerHour / 2)}
                                    />
                                ))}
                            </div>
                        )}

                        {!loading && availableCourts.length === 0 && selectedSlots.length > 0 && !error && (
                            <div className="text-center py-8">
                                <p className="text-text-secondary">
                                    Presiona "Buscar Canchas" para ver la disponibilidad.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modal de reserva */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-secondary p-6 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
                        {!preferenceId ? (
                            <div>
                                <h3 className="text-2xl font-bold mb-4 text-white text-center">
                                    Confirmar Reserva
                                </h3>

                                {/* Detalles de la reserva */}
                                <div className="bg-dark-primary p-4 rounded-lg mb-4">
                                    <p className="text-text-primary mb-2">
                                        <span className="text-text-secondary">Cancha:</span>
                                        <span className="font-bold text-secondary ml-2">{bookingCourt?.name}</span>
                                    </p>
                                    <p className="text-text-primary mb-2">
                                        <span className="text-text-secondary">Fecha:</span>
                                        <span className="font-bold text-secondary ml-2">
                                            {format(selectedDate, 'eeee dd/MM/yyyy', { locale: es })}
                                        </span>
                                    </p>
                                    <p className="text-text-primary mb-2">
                                        <span className="text-text-secondary">Horarios:</span>
                                        <span className="font-bold text-secondary ml-2">
                                            {selectedSlots.map(s => s.time).join(', ')}hs
                                        </span>
                                    </p>
                                    <p className="text-text-primary">
                                        <span className="text-text-secondary">Total:</span>
                                        <span className="font-bold text-secondary text-lg ml-2">
                                            ${totalPrice}
                                        </span>
                                    </p>
                                </div>

                                <p className="text-text-secondary mb-4 text-center">
                                    Por favor, completa tus datos para continuar:
                                </p>

                                {/* Formulario de datos */}
                                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                                    <div>
                                        <label htmlFor="clientName" className="block text-sm text-text-secondary mb-1">
                                            Nombre Completo *
                                        </label>
                                        <input
                                            type="text"
                                            id="clientName"
                                            name="name"
                                            autoComplete="name"
                                            value={clientData.name}
                                            onChange={handleClientDataChange}
                                            className="w-full p-3 text-black rounded-lg border border-gray-300 focus:border-primary focus:outline-none"
                                            placeholder="Ingresa tu nombre completo"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="clientPhone" className="block text-sm text-text-secondary mb-1">
                                            Teléfono *
                                        </label>
                                        <input
                                            type="tel"
                                            id="clientPhone"
                                            name="phone"
                                            autoComplete="tel"
                                            value={clientData.phone}
                                            onChange={handleClientDataChange}
                                            className="w-full p-3 text-black rounded-lg border border-gray-300 focus:border-primary focus:outline-none"
                                            placeholder="Ej: 1234567890"
                                            required
                                        />
                                    </div>

                                    {error && (
                                        <div className="bg-red-900/20 border border-red-600 text-red-300 px-3 py-2 rounded text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* Botones de acción */}
                                    <div className="flex flex-col gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={handleCreatePreference}
                                            disabled={isSubmitting}
                                            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Procesando...' : 'Pagar con Mercado Pago'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCashBooking}
                                            disabled={isSubmitting}
                                            className="w-full bg-secondary text-dark-primary font-bold py-3 rounded-lg hover:opacity-80 transition-opacity disabled:bg-gray-600 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? 'Procesando...' : 'Confirmar (Pago en Efectivo)'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            disabled={isSubmitting}
                                            className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-bold mb-4 text-white text-center">
                                    Completar Pago
                                </h3>
                                <div id="wallet_container" className="min-h-[200px]"></div>
                                <button
                                    onClick={closeModal}
                                    className="w-full bg-gray-600 text-white py-2 rounded-lg mt-4 hover:bg-gray-700 transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TimeSlotFinder;