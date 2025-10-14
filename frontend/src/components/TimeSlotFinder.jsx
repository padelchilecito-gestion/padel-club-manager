import React, { useState, useEffect, useMemo } from 'react';
import { bookingService } from '../services/bookingService';
import { courtService } from '../services/courtService';
import { settingService } from '../services/settingService';
import { format, getDay, addMinutes, setHours, setMinutes, startOfDay } from 'date-fns';

const TimeSlotFinder = ({ courts, settings = {}, onSelectSlot }) => {
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [allBookings, setAllBookings] = useState([]);
    const [timeSlots, setTimeSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Generate time slots
    const generateTimeSlots = useMemo(() => {
        const { minTime = '09:00', maxTime = '22:00', slotDuration = 60 } = settings;
        const slots = [];
        let [startHour, startMinute] = minTime.split(':').map(Number);
        let [endHour, endMinute] = maxTime.split(':').map(Number);

        let currentTime = setMinutes(setHours(startOfDay(new Date(selectedDate)), startHour), startMinute);
        const endTime = setMinutes(setHours(startOfDay(new Date(selectedDate)), endHour), endMinute);

        while (currentTime < endTime) {
            slots.push(new Date(currentTime));
            currentTime = addMinutes(currentTime, slotDuration);
        }
        return slots;
    }, [selectedDate, settings]);

    useEffect(() => {
        setTimeSlots(generateTimeSlots);
    }, [generateTimeSlots]);

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
        if (onSelectSlot) {
            onSelectSlot({ court, time, date: selectedDate });
        }
    };

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
        </div>
    );
};

export default TimeSlotFinder;