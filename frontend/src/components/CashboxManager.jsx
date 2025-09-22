import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CashboxManager = () => {
    const [session, setSession] = useState(null);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startAmount, setStartAmount] = useState('');
    const [endAmount, setEndAmount] = useState('');
    const { user } = useAuth();

    const fetchCurrentSession = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get('/cashbox/current');
            setSession(res.data.session);
            setReport(res.data.report);
        } catch (err) {
            setError('Error al cargar la sesión de caja.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCurrentSession();
    }, [fetchCurrentSession]);

    const handleStartSession = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/cashbox/start', { startAmount: parseFloat(startAmount) });
            fetchCurrentSession();
            setStartAmount('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al iniciar la caja.');
        }
    };

    const handleCloseSession = async (e) => {
        e.preventDefault();
        if (!window.confirm("¿Estás seguro de que quieres cerrar la caja? Esta acción no se puede deshacer.")) return;
        try {
            // Asumimos que el ID del usuario está en el contexto de Auth
            const userId = JSON.parse(atob(localStorage.getItem('token').split('.')[1])).id;
            await axios.post('/cashbox/close', { endAmount: parseFloat(endAmount), userId });
            fetchCurrentSession();
            setEndAmount('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cerrar la caja.');
        }
    };

    if (loading) return <p className="text-center">Cargando Caja...</p>;
    if (error) return <p className="text-danger text-center">{error}</p>;

    if (!session) {
        return (
            <div className="max-w-md mx-auto bg-dark-secondary p-8 rounded-lg">
                <h3 className="text-2xl font-bold text-secondary mb-4">Iniciar Caja</h3>
                <p className="text-text-secondary mb-6">No hay ninguna sesión de caja abierta. Ingresa el monto inicial para comenzar.</p>
                <form onSubmit={handleStartSession}>
                    <label htmlFor="startAmount" className="text-sm">Efectivo Inicial ($)</label>
                    <input type="number" id="startAmount" value={startAmount} onChange={e => setStartAmount(e.target.value)}
                        className="w-full p-2 mt-1" required min="0" step="0.01" />
                    <button type="submit" className="w-full mt-4 bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary-dark">Iniciar Sesión de Caja</button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto bg-dark-secondary p-8 rounded-lg">
            <h3 className="text-2xl font-bold text-secondary mb-4">Gestión de Caja - ABIERTA</h3>
            <div className="space-y-4 text-lg">
                <div className="flex justify-between"><span className="text-text-secondary">Hora de Inicio:</span> <span className="font-bold">{new Date(session.startTime).toLocaleTimeString()}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Efectivo Inicial:</span> <span className="font-bold">${session.startAmount.toFixed(2)}</span></div>
                <hr className="border-gray-600" />
                <div className="flex justify-between"><span className="text-text-secondary">Ventas en Efectivo:</span> <span className="font-bold text-green-400">+ ${report?.totalSalesCash.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-text-secondary">Turnos Cobrados en Efectivo:</span> <span className="font-bold text-green-400">+ ${report?.totalBookingsCash.toFixed(2)}</span></div>
                <hr className="border-gray-600" />
                <div className="flex justify-between text-2xl"><span className="text-white">Total Esperado en Caja:</span> <span className="font-bold text-secondary">${report?.expectedTotal.toFixed(2)}</span></div>
            </div>

            <form onSubmit={handleCloseSession} className="mt-8 border-t border-gray-600 pt-6">
                <h4 className="text-xl font-bold mb-4">Cerrar Caja</h4>
                <label htmlFor="endAmount" className="text-sm">Efectivo Contado ($)</label>
                <input type="number" id="endAmount" value={endAmount} onChange={e => setEndAmount(e.target.value)}
                    className="w-full p-2 mt-1" required min="0" step="0.01" />
                <button type="submit" className="w-full mt-4 bg-danger text-white font-bold py-3 rounded-lg hover:bg-red-700">Cerrar Caja y Generar Reporte</button>
            </form>
        </div>
    );
};

export default CashboxManager;