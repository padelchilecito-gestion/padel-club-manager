import React, { useState, useEffect, useMemo } from 'react';
import { bookingService } from '../services/bookingService';
import { courtService } from '../services/courtService';
import { settingService } from '../services/settingService';
import { format, getDay, addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';

const TimeSlotFinder = ({ onTimeSelect }) => {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [allBookings, setAllBookings] = useState([]);
    const [allCourts, setAllCourts] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [clubSettings, setClubSettings] = useState(null);

    // 1. Fetch initial static data (courts and settings)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                setError(''); // Reset error on new fetch
                const [settingsData, courtsData] = await Promise.all([
                    settingService.getSettings(),
                    courtService.getAllCourts()
                ]);
                setClubSettings(settingsData);
                setAllCourts(courtsData.filter(c => c.isActive));
            } catch (err) {
                setError('No se pudieron cargar los datos iniciales.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // 2. Fetch availability (bookings) when date changes
    useEffect(() => {
        if (!selectedDate) return;

        const fetchAvailability = async () => {
            try {
                setLoading(true);
                setError('');
                // The crucial timezone fix is applied here
                const date = new Date(selectedDate + 'T00:00:00');
                const data = await bookingService.getAvailability(date.toISOString());
                setAllBookings(data);
            } catch (err) {
                setError('No se pudo cargar la disponibilidad para la fecha seleccionada.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAvailability();
    }, [selectedDate]);

    // 3. Generate time slots based on settings and date
    useEffect(() => {
        if (!clubSettings) return;

        const generateTimeSlots = () => {
            const date = new Date(selectedDate + 'T00:00:00');
            const dayOfWeek = getDay(date);
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            const openingHour = parseInt(isWeekend ? clubSettings.WEEKEND_OPENING_HOUR : clubSettings.WEEKDAY_OPENING_HOUR, 10);
            const closingHour = parseInt(isWeekend ? clubSettings.WEEKEND_CLOSING_HOUR : clubSettings.WEEKDAY_CLOSING_HOUR, 10);
            // Use the slot duration from the settings
            const slotDuration = parseInt(clubSettings.SLOT_DURATION, 10) || 30;

            const slots = [];
            let currentTime = setMinutes(setHours(startOfDay(date), openingHour), 0);
            const endTime = setMinutes(setHours(startOfDay(date), closingHour), 0);
            const now = new Date();

            while (currentTime < endTime) {
                if (currentTime > now) { // Only show future slots
                    slots.push(currentTime);
                }
                currentTime = addMinutes(currentTime, slotDuration);
            }
            setTimeSlots(slots);
        };

        generateTimeSlots();
    }, [selectedDate, clubSettings]);

    // Memoized calculation to find available courts for a given time slot
    const getAvailableCourtsForSlot = useMemo(() => {
        return (timeSlot) => {
            const slotEnd = addMinutes(timeSlot, 30);

            const bookedCourtIds = allBookings
                .filter(booking => {
                    const bookingStart = new Date(booking.startTime);
                    const bookingEnd = new Date(booking.endTime);
                    // Check for any overlap between the booking and the time slot
                    return (bookingStart < slotEnd && bookingEnd > timeSlot);
                })
                .map(booking => booking.court._id);

            return allCourts.filter(court => !bookedCourtIds.includes(court._id));
        };
    }, [allBookings, allCourts]);

    // Handler to pass selected data to the parent component
    const handleCourtSelection = (court, time) => {
        if (onTimeSelect) {
            onTimeSelect(court, time, selectedDate);
        }
    };

    const DiagnosticPanel = () => (
        <div className="mt-8 p-4 border border-dashed border-yellow-500 rounded-lg bg-gray-800 text-white font-mono text-xs">
            <h3 className="font-bold text-yellow-400 mb-2">--- Panel de Diagnóstico ---</h3>
            <p><strong>Error State:</strong> {JSON.stringify(error, null, 2)}</p>
            <p><strong>Loading State:</strong> {JSON.stringify(loading)}</p>
            <p><strong>Club Settings Loaded:</strong> {clubSettings ? 'Sí' : 'No'}</p>
            <p><strong>Courts Loaded:</strong> {allCourts.length}</p>
            <p><strong>Time Slots Generated:</strong> {timeSlots.length}</p>
        </div>
    );

    return (
        <div className="bg-dark-secondary p-6 md:p-8 rounded-lg shadow-lg">
            <div className="mb-6">
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

            {loading && <p className="text-text-secondary text-center">Cargando disponibilidad...</p>}
            {error && <p className="text-danger text-center">{error}</p>}

            <div className="space-y-4">
                {timeSlots.map(time => {
                    const availableCourts = getAvailableCourtsForSlot(time);
                    return (
                        <div key={time.toISOString()}>
                            <h3 className="text-xl font-semibold text-primary mb-2">{format(time, 'HH:mm')}</h3>
                            {availableCourts.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {availableCourts.map(court => (
                                        <button
                                            key={court._id}
                                            onClick={() => handleCourtSelection(court, time)}
                                            className="px-4 py-2 bg-secondary hover:bg-opacity-80 text-white font-bold rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary"
                                        >
                                            {court.name}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-text-secondary">No hay canchas disponibles en este horario.</p>
                            )}
                        </div>
                    );
                })}
            </div>
            {/* Render the diagnostic panel */}
            <DiagnosticPanel />
        </div>
    );
};

export default TimeSlotFinder;