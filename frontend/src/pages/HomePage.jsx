import React, { useState } from 'react';
import { format, addDays, startOfToday, isBefore, setHours, setMinutes, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import api from '../services/api'; // Usaremos api directamente para simplificar
import toast from 'react-hot-toast';

// --- Componentes Internos para Claridad ---

const DateSelector = ({ selectedDate, onDateChange, loading }) => {
    const isToday = format(selectedDate, 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd');
    return (
        <div className="mb-6 flex justify-between items-center bg-gray-800 p-3 rounded-md shadow">
            <button onClick={() => onDateChange(-1)} disabled={isToday || loading}>Anterior</button>
            <span className="text-lg font-semibold">{format(selectedDate, 'EEEE dd MMM', { locale: es })}</span>
            <button onClick={() => onDateChange(1)} disabled={loading}>Siguiente</button>
        </div>
    );
};

const TimeSlotSelector = ({ onSelect }) => {
    const hours = Array.from({ length: 14 }, (_, i) => 9 + i); // 9am to 10pm
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">2. Elige un Horario</h2>
            <div className="grid grid-cols-4 gap-2">
                {hours.map(hour => (
                    <button key={hour} onClick={() => onSelect(`${hour}:00`)} className="p-3 bg-purple-600 rounded-md hover:bg-purple-700">
                        {`${hour}:00`}
                    </button>
                ))}
            </div>
        </div>
    );
};

const CourtSelector = ({ courts, onSelect }) => (
    <div>
        <h2 className="text-xl font-bold mb-4">3. Elige una Cancha</h2>
        <div className="space-y-2">
            {courts.map(court => (
                <div key={court._id} className="p-4 bg-gray-700 rounded-md flex justify-between items-center">
                    <div>
                        <p className="font-bold">{court.name}</p>
                        <p className="text-sm">${court.pricePerHour}</p>
                    </div>
                    <button onClick={() => onSelect(court)} className="px-4 py-2 bg-green-600 rounded-md hover:bg-green-700">Reservar</button>
                </div>
            ))}
        </div>
    </div>
);

const BookingForm = ({ court, dateTime, onSubmit }) => {
    const [formData, setFormData] = useState({ clientName: '', clientPhone: '' });
    const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    return (
        <div>
            <h2 className="text-xl font-bold mb-4">4. Completa tus Datos</h2>
            <div className="p-4 bg-gray-700 rounded-md">
                <p><b>Cancha:</b> {court.name}</p>
                <p><b>Fecha:</b> {format(dateTime, "dd/MM/yyyy 'a las' HH:mm")}</p>
                <form className="space-y-4 mt-4" onSubmit={e => { e.preventDefault(); onSubmit(formData); }}>
                    <input type="text" name="clientName" placeholder="Nombre Completo" required onChange={handleChange} className="w-full p-2 rounded-md bg-gray-800"/>
                    <input type="tel" name="clientPhone" placeholder="Teléfono" required onChange={handleChange} className="w-full p-2 rounded-md bg-gray-800"/>
                    <div className="flex space-x-2">
                        <button type="submit" name="Efectivo" className="w-full p-2 bg-blue-600 rounded-md hover:bg-blue-700">Pagar en el Club</button>
                        <button type="submit" name="MercadoPago" className="w-full p-2 bg-sky-500 rounded-md hover:bg-sky-600">Pagar con Mercado Pago</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Componente Principal de la Página ---

const HomePage = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(startOfToday());
    const [selectedTime, setSelectedTime] = useState(null);
    const [availableCourts, setAvailableCourts] = useState([]);
    const [selectedCourt, setSelectedCourt] = useState(null);

    const handleDateChange = (days) => {
        const newDate = addDays(selectedDate, days);
        if (isBefore(newDate, startOfToday())) return;
        setSelectedDate(newDate);
        setStep(2);
    };

    const handleTimeSelect = async (time) => {
        setLoading(true);
        setSelectedTime(time);
        try {
            const [hour, minute] = time.split(':');
            const fullDateTime = setMinutes(setHours(selectedDate, hour), minute);
            const { data } = await api.get(`/availability/courts?dateTime=${fullDateTime.toISOString()}`);
            if (data.length > 0) {
                setAvailableCourts(data);
                setStep(3);
            } else {
                toast.error('No hay canchas disponibles en este horario.');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al buscar disponibilidad.');
        } finally {
            setLoading(false);
        }
    };

    const handleCourtSelect = (court) => {
        setSelectedCourt(court);
        setStep(4);
    };

    const handleBookingSubmit = async (clientData, paymentMethod) => {
        setLoading(true);
        try {
            const [hour, minute] = selectedTime.split(':');
            const fullDateTime = setMinutes(setHours(selectedDate, hour), minute);

            const bookingPayload = {
                courtId: selectedCourt._id,
                ...clientData,
                dateTime: fullDateTime.toISOString(),
            };

            if (paymentMethod === 'Efectivo') {
                await api.post('/bookings/cash', bookingPayload);
                toast.success('¡Reserva confirmada! Te esperamos.');
                resetFlow();
            } else {
                const { data } = await api.post('/bookings/mercadopago', bookingPayload);
                window.location.href = data.init_point;
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error al crear la reserva.');
        } finally {
            setLoading(false);
        }
    };

    // Modificar el onSubmit para capturar el método de pago del botón
    const onFormSubmit = (clientData) => {
        const paymentMethod = document.activeElement.name;
        handleBookingSubmit(clientData, paymentMethod);
    };

    const resetFlow = () => {
        setStep(1);
        setSelectedDate(startOfToday());
        setSelectedTime(null);
        setAvailableCourts([]);
        setSelectedCourt(null);
    };

    return (
        <div className="container mx-auto max-w-lg p-4">
            <h1 className="text-3xl font-bold text-center mb-6">Reservar Cancha</h1>
            {step > 1 && <button onClick={resetFlow} className="text-sm text-purple-400 mb-4">&larr; Empezar de nuevo</button>}

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold mb-2">1. Elige un Día</h2>
                    <DateSelector selectedDate={selectedDate} onDateChange={handleDateChange} loading={loading} />
                </div>

                {loading && <p>Buscando...</p>}

                {step === 2 && <TimeSlotSelector onSelect={handleTimeSelect} />}
                {step === 3 && <CourtSelector courts={availableCourts} onSelect={handleCourtSelect} />}
                {step === 4 && <BookingForm court={selectedCourt} dateTime={parse(`${format(selectedDate, 'yyyy-MM-dd')} ${selectedTime}`, 'yyyy-MM-dd HH:mm', new Date())} onSubmit={onFormSubmit} />}
            </div>
        </div>
    );
};

export default HomePage;
