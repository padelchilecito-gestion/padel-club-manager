import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CourtManager = () => {
    const [courts, setCourts] = useState([]);
    const [formData, setFormData] = useState({ name: '', courtType: 'Cemento', pricePerHour: '' });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCourts = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/courts/all');
            setCourts(res.data);
            setLoading(false);
        } catch (err) {
            setError('No se pudieron cargar las canchas.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourts();
    }, []);

    const handleChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        const action = editingId ? axios.put(`/courts/${editingId}`, formData) : axios.post('/courts', formData);
        
        try {
            await action;
            fetchCourts();
            resetForm();
        } catch (err) {
            setError(`Error al ${editingId ? 'actualizar' : 'crear'} la cancha.`);
        }
    };

    const handleEdit = court => {
        setFormData({ name: court.name, courtType: court.courtType, pricePerHour: court.pricePerHour });
        setEditingId(court._id);
    };

    const handleToggleActive = async (id) => {
        if (window.confirm('¿Estás seguro de que quieres cambiar el estado de esta cancha?')) {
            try {
                await axios.delete(`/courts/${id}`);
                fetchCourts();
            } catch (err) {
                setError('Error al cambiar el estado de la cancha.');
            }
        }
    };

    const resetForm = () => {
        setFormData({ name: '', courtType: 'Cemento', pricePerHour: '' });
        setEditingId(null);
    };

    return (
        <div className="animate-fade-in">
            <h3 className="text-xl font-bold mb-4 text-secondary">
                {editingId ? 'Editando Cancha' : 'Agregar Nueva Cancha'}
            </h3>
            
            {error && <p className="text-danger bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="bg-dark-secondary p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                    <label htmlFor="courtName" className="text-sm text-text-secondary">Nombre de la cancha</label>
                    <input type="text" id="courtName" name="name" value={formData.name} onChange={handleChange} className="w-full mt-1 p-2" required />
                </div>
                <div>
                    <label htmlFor="courtType" className="text-sm text-text-secondary">Tipo de cancha</label>
                    <select id="courtType" name="courtType" value={formData.courtType} onChange={handleChange} className="w-full mt-1 p-2">
                        <option>Cemento</option>
                        <option>Césped Sintético</option>
                        <option>Cristal</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="pricePerHour" className="text-sm text-text-secondary">Precio por hora ($)</label>
                    <input type="number" id="pricePerHour" name="pricePerHour" value={formData.pricePerHour} onChange={handleChange} className="w-full mt-1 p-2" required min="0" />
                </div>
                <div className="flex gap-4 md:col-span-3">
                    <button type="submit" className="flex-grow bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark transition">{editingId ? 'Actualizar Cancha' : 'Agregar Cancha'}</button>
                    {editingId && <button type="button" onClick={resetForm} className="flex-grow bg-text-secondary text-dark-primary font-bold py-2 px-4 rounded">Cancelar</button>}
                </div>
            </form>

            <h3 className="text-xl font-bold mb-4 text-secondary">Lista de Canchas</h3>
            {loading ? <p>Cargando...</p> : (
                <div className="space-y-3">
                    {courts.map(court => (
                        <div key={court._id} className={`p-4 rounded-lg flex justify-between items-center ${court.isActive ? 'bg-dark-secondary' : 'bg-gray-800 opacity-60'}`}>
                            <div>
                                <p className="font-bold text-text-primary">{court.name} <span className="font-normal text-xs text-text-secondary">{court.courtType}</span></p>
                                <p className="text-sm text-secondary font-semibold">${court.pricePerHour} / hora</p>
                            </div>
                            <div className="flex items-center gap-2">
                                 <span className={`px-3 py-1 text-xs font-bold rounded-full ${court.isActive ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                                    {court.isActive ? 'Activa' : 'Inactiva'}
                                </span>
                                <button onClick={() => handleEdit(court)} className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700">Editar</button>
                                <button onClick={() => handleToggleActive(court._id)} className="bg-danger text-white px-3 py-1 rounded-md text-sm hover:bg-red-700">
                                    {court.isActive ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
export default CourtManager;