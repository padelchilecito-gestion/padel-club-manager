import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const API_URL = 'http://localhost:5001';
const socket = io(API_URL);

const BookingManager = () => {
    const [bookings, setBookings] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Estados para el modal de edición ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBooking, setEditingBooking] = useState(null);
    const [availableSlots, setAvailableSlots] = useState([]);
    const [newSlot, setNewSlot] = useState('');
    const [loadingModal, setLoadingModal] = useState(false);
    
    // --- Estados para el modal de creación ---
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [courts, setCourts] = useState([]);
    const [createFormData, setCreateFormData] = useState({
        courtId: '',
        time: '',
        clientName: '',
        clientPhone: ''
    });
    const [createAvailableSlots, setCreateAvailableSlots] = useState([]);

    const fetchBookings = useCallback(async (selectedDate) => {
        setLoading(true);
        setError('');
        const startOfDay = new Date(selectedDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setUTCHours(23, 59, 59, 999);
        
        try {
            const res = await axios.get(`/bookings?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
            const sortedBookings = res.data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
            setBookings(sortedBookings);
        } catch (err) {
            setError("Error al obtener las reservas.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBookings(date);
        const handleUpdate = () => fetchBookings(date);
        socket.on('booking_update', handleUpdate);
        socket.on('booking_deleted', handleUpdate);
        return () => {
            socket.off('booking_update', handleUpdate);
            socket.off('booking_deleted', handleUpdate);
        };
    }, [date, fetchBookings]);
    
    const timeSlots = useMemo(() => {
        const slots = [];
        for (let i = 9; i <= 23; i++) {
            for (let j = 0; j < 60; j += 30) {
                 if (i === 23 && j === 30) continue;
                slots.push(`${String(i).padStart(2, '0')}:${String(j).padStart(2, '0')}`);
            }
        }
        return slots;
    }, []);

    // --- FUNCIÓN PARA CAMBIAR EL ESTADO ---
    const handleChangeStatus = async (bookingId, newStatus) => {
        try {
            await axios.patch(`/bookings/${bookingId}/status`, { status: newStatus });
            // La lista se actualizará sola gracias al evento de socket.
        } catch (err) {
            alert(err.response?.data?.message || 'Error al cambiar el estado de la reserva.');
        }
    };

    // --- Lógica para el modal de creación ---
    const handleOpenCreateModal = async () => {
        try {
            const res = await axios.get('/courts');
            setCourts(res.data);
            if (res.data.length > 0) {
                handleCourtChangeForCreate(res.data[0]._id);
                setCreateFormData({
                    courtId: res.data[0]._id,
                    time: '',
                    clientName: '',
                    clientPhone: ''
                });
            }
            setIsCreateModalOpen(true);
        } catch (err) {
            setError('No se pudieron cargar las canchas.');
        }
    };
    
    const handleCourtChangeForCreate = async (courtId) => {
        setCreateFormData(prev => ({ ...prev, courtId, time: '' }));
        const startOfDay = new Date(date); startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(date); endOfDay.setUTCHours(23, 59, 59, 999);
        try {
            const res = await axios.get(`/bookings?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
            const bookedTimes = res.data
                .filter(b => b.court._id === courtId)
                .map(b => new Date(b.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' }));
            
            const available = timeSlots.filter(slot => !bookedTimes.includes(slot));
            setCreateAvailableSlots(available);
        } catch(err) {
            setError("Error al buscar horarios para la cancha seleccionada.");
        }
    };
    
    const handleCreateBooking = async (e) => {
        e.preventDefault();
        const { courtId, time, clientName, clientPhone } = createFormData;
        if (!courtId || !time || !clientName || !clientPhone) {
            alert('Por favor, completa todos los campos.');
            return;
        }

        const [hour, minute] = time.split(':');
        const startTime = new Date(date);
        startTime.setUTCHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
        const endTime = new Date(startTime.getTime() + 30 * 60000);
        const court = courts.find(c => c._id === courtId);

        try {
            await axios.post('/bookings', {
                court: courtId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                user: { name: clientName, phone: clientPhone },
                status: 'Confirmed',
                price: court.pricePerHour / 2
            });
            setIsCreateModalOpen(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Error al crear la reserva.');
        }
    };

    // --- Lógica para editar y eliminar ---
    const handleOpenEditModal = async (booking) => {
        setEditingBooking(booking);
        setLoadingModal(true);
        setIsEditModalOpen(true);
        const selectedDate = new Date(booking.startTime);
        const startOfDay = new Date(selectedDate); startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate); endOfDay.setHours(23, 59, 59, 999);
        try {
            const res = await axios.get(`/bookings?start=${startOfDay.toISOString()}&end=${endOfDay.toISOString()}`);
            const todaysBookingsOnCourt = res.data.filter(b => b.court._id === booking.court._id);
            const bookedTimes = todaysBookingsOnCourt.map(b => new Date(b.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' }));
            const available = timeSlots.filter(slot => !bookedTimes.includes(slot));
            setAvailableSlots(available);
            setNewSlot(new Date(booking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' }));
        } catch (err) {
            setError("Error al cargar horarios disponibles.");
        } finally {
            setLoadingModal(false);
        }
    };
    
    const handleUpdateBooking = async () => {
        if (!newSlot || !editingBooking) return;
        
        const [hour, minute] = newSlot.split(':');
        const newStartTime = new Date(editingBooking.startTime);
        newStartTime.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
        const newEndTime = new Date(newStartTime.getTime() + 30 * 60000);
    
        try {
            await axios.put(`/bookings/${editingBooking._id}`, {
                startTime: newStartTime.toISOString(),
                endTime: newEndTime.toISOString()
            });
            setIsEditModalOpen(false);
            setEditingBooking(null);
        } catch (err) {
            alert(err.response?.data?.message || 'Error al modificar la reserva.');
        }
    };
    
    const handleCancelBooking = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva? El turno quedará libre.')) {
            try {
                await axios.delete(`/bookings/${id}`);
            } catch (err) {
                setError('Error al eliminar la reserva.');
            }
        }
    };

    const getStatusClass = (status) => {
        if (status === 'Confirmed') return 'bg-secondary text-dark-primary';
        if (status === 'Pending') return 'bg-yellow-500 text-dark-primary';
        if (status === 'Cancelled') return 'bg-gray-600 text-white';
        return 'bg-gray-500';
    };

    return (
        <div className="animate-fade-in">
            <div className="flex justify-between items-center gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <h3 className="text-xl font-bold text-secondary">Turnos del Día</h3>
                    <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="p-2 bg-dark-primary rounded-lg border border-gray-600"/>
                </div>
                <button onClick={handleOpenCreateModal} className="bg-primary text-white font-bold py-2 px-4 rounded-lg hover:bg-primary-dark transition-transform transform hover:scale-105">
                    + Agregar Turno
                </button>
            </div>
            
            {error && <p className="text-danger text-center mb-4">{error}</p>}
            
            <div className="bg-dark-secondary rounded-lg overflow-hidden shadow-lg">
                <table className="min-w-full text-left">
                    <thead className="bg-gray-700/50">
                        <tr>
                            <th className="p-3">Hora</th>
                            <th className="p-3">Cancha</th>
                            <th className="p-3">Cliente</th>
                            <th className="p-3 text-center">Estado</th>
                            <th className="p-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="5" className="text-center p-8">Cargando...</td></tr>
                        ) : bookings.length > 0 ? bookings.map(b => (
                            <tr key={b._id} className="hover:bg-gray-700/30">
                                <td className="p-3 font-mono">{new Date(b.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                                <td className="p-3">{b.court?.name || 'N/A'}</td>
                                <td className="p-3">{b.user?.name || 'N/A'}</td>
                                <td className="p-3 text-center">
                                    <select 
                                        value={b.status} 
                                        onChange={(e) => handleChangeStatus(b._id, e.target.value)}
                                        className={`px-3 py-1 text-xs font-bold rounded-full border-0 focus:ring-0 ${getStatusClass(b.status)}`}
                                    >
                                        <option value="Pending">Pendiente</option>
                                        <option value="Confirmed">Confirmado</option>
                                        <option value="Cancelled">Cancelado</option>
                                    </select>
                                </td>
                                <td className="p-3 text-center">
                                    <button onClick={() => handleOpenEditModal(b)} className="text-blue-400 text-xs hover:underline mr-2">Editar Hora</button>
                                    <button onClick={() => handleCancelBooking(b._id)} className="text-danger text-xs hover:underline">Eliminar</button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="5" className="text-center p-8 text-text-secondary">No hay reservas para esta fecha.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isEditModalOpen && editingBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <div className="bg-dark-secondary p-8 rounded-lg max-w-md w-full">
                        <h3 className="text-2xl font-bold mb-4">Modificar Reserva</h3>
                        <p className="text-text-secondary mb-1">Cliente: <span className="text-white font-semibold">{editingBooking.user?.name}</span></p>
                        <p className="text-text-secondary mb-4">Cancha: <span className="text-white font-semibold">{editingBooking.court?.name}</span></p>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="newSlot" className="text-sm text-text-secondary">Nuevo Horario</label>
                                {loadingModal ? <p className="text-center mt-2">Cargando horarios disponibles...</p> : (
                                    <select id="newSlot" value={newSlot} onChange={(e) => setNewSlot(e.target.value)} className="w-full mt-1 p-2">
                                        <option value={new Date(editingBooking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' })}>
                                            {new Date(editingBooking.startTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute:'2-digit' })} (Actual)
                                        </option>
                                        {availableSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <button onClick={handleUpdateBooking} disabled={loadingModal} className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark disabled:opacity-50">
                                Guardar Cambios
                            </button>
                            <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-full bg-gray-600 py-2 rounded-lg mt-2 hover:bg-gray-700">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isCreateModalOpen && (
                 <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
                    <form onSubmit={handleCreateBooking} className="bg-dark-secondary p-8 rounded-lg max-w-lg w-full">
                        <h3 className="text-2xl font-bold mb-6">Agregar Reserva Manualmente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <label htmlFor="clientName" className="text-sm text-text-secondary">Nombre del Cliente</label>
                                <input type="text" id="clientName" value={createFormData.clientName} onChange={e => setCreateFormData(prev => ({...prev, clientName: e.target.value}))} className="w-full mt-1 p-2" required />
                            </div>
                            <div>
                                <label htmlFor="clientPhone" className="text-sm text-text-secondary">Teléfono del Cliente</label>
                                <input type="tel" id="clientPhone" value={createFormData.clientPhone} onChange={e => setCreateFormData(prev => ({...prev, clientPhone: e.target.value}))} className="w-full mt-1 p-2" required />
                            </div>
                            <div>
                                <label htmlFor="courtId" className="text-sm text-text-secondary">Cancha</label>
                                <select id="courtId" value={createFormData.courtId} onChange={e => handleCourtChangeForCreate(e.target.value)} className="w-full mt-1 p-2">
                                    {courts.map(court => (
                                        <option key={court._id} value={court._id}>{court.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="time" className="text-sm text-text-secondary">Horario</label>
                                <select id="time" value={createFormData.time} onChange={e => setCreateFormData(prev => ({...prev, time: e.target.value}))} className="w-full mt-1 p-2" required>
                                    <option value="" disabled>Seleccionar turno</option>
                                    {createAvailableSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-4 mt-6">
                            <button type="submit" className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark">
                                Confirmar Reserva
                            </button>
                            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="w-full bg-gray-600 py-2 rounded-lg mt-2 hover:bg-gray-700">
                                Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default BookingManager;