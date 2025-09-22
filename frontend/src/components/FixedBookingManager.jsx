import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FixedBookingManager = () => {
    const [courts, setCourts] = useState([]);
    const [formData, setFormData] = useState({
        court: '',
        name: '',
        phone: '',
        dayOfWeek: '1', // Lunes por defecto
        time: '20:00',
        endDate: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCourts = async () => {
            try {
                const res = await axios.get('/courts/all');
                if (res.data.length > 0) {
                    setCourts(res.data);
                    setFormData(prev => ({ ...prev, court: res.data[0]._id }));
                }
            } catch (err) {
                setError("No se pudieron cargar las canchas.");
            }
        };
        fetchCourts();
    }, []);

    const handleChange = e => {
        setMessage('');
        setError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        const payload = {
            court: formData.court,
            user: {
                name: formData.name,
                phone: formData.phone
            },
            dayOfWeek: formData.dayOfWeek,
            time: formData.time,
            endDate: formData.endDate
        };

        try {
            const res = await axios.post('/bookings/fixed', payload);
            setMessage(res.data.message);
            // Opcional: limpiar formulario
            // setFormData({ ...formData, name: '', phone: '' });
        } catch (err) {
            setError(err.response?.data?.message || "Error al crear el turno fijo.");
        } finally {
            setLoading(false);
        }
    };
    
    // Generador de horarios cada 30 min
    const timeSlots = [];
    for (let i = 9; i <= 23; i++) {
        timeSlots.push(`${i}:00`);
        if (i < 23) timeSlots.push(`${i}:30`);
    }

    return (
        <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-secondary">Crear Nuevo Turno Fijo</h3>
            <p className="text-text-secondary mb-6 text-sm">
                Esta herramienta creará reservas recurrentes para un cliente en un día y horario específico hasta la fecha de finalización.
            </p>

            {error && <p className="text-danger bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
            {message && <p className="text-secondary bg-green-900/50 p-3 rounded-lg mb-4">{message}</p>}

            <form onSubmit={handleSubmit} className="bg-dark-secondary p-6 rounded-lg grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna 1 */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="name">Nombre del Cliente</label>
                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div>
                        <label htmlFor="phone">Teléfono del Cliente</label>
                        <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} required />
                    </div>
                     <div>
                        <label htmlFor="court">Cancha</label>
                        <select id="court" name="court" value={formData.court} onChange={handleChange} required>
                            {courts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>
                {/* Columna 2 */}
                <div className="space-y-4">
                     <div>
                        <label htmlFor="dayOfWeek">Día de la Semana</label>
                        <select id="dayOfWeek" name="dayOfWeek" value={formData.dayOfWeek} onChange={handleChange} required>
                            <option value="1">Lunes</option>
                            <option value="2">Martes</option>
                            <option value="3">Miércoles</option>
                            <option value="4">Jueves</option>
                            <option value="5">Viernes</option>
                            <option value="6">Sábado</option>
                            <option value="0">Domingo</option>
                        </select>
                    </div>
                     <div>
                        <label htmlFor="time">Hora</label>
                        <select id="time" name="time" value={formData.time} onChange={handleChange} required>
                            {timeSlots.map(t => <option key={t} value={t}>{t} hs</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="endDate">Válido hasta (Fecha Fin)</label>
                        <input type="date" id="endDate" name="endDate" value={formData.endDate} onChange={handleChange} required />
                    </div>
                </div>
                <div className="md:col-span-2">
                    <button type="submit" disabled={loading} className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-500">
                        {loading ? 'Generando Reservas...' : 'Crear Turno Fijo'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FixedBookingManager;