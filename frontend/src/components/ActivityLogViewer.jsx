import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ActivityLogViewer = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchLogs = useCallback(async (pageNum) => {
        setLoading(true);
        try {
            const res = await axios.get(`/logs?page=${pageNum}`);
            setLogs(res.data.logs);
            setTotalPages(res.data.totalPages);
            setPage(res.data.currentPage);
        } catch (err) {
            setError('No se pudo cargar el registro de actividad.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLogs(page);
    }, [page, fetchLogs]);

    return (
        <div className="animate-fade-in">
            <h3 className="text-2xl font-bold mb-4 text-secondary">Registro de Actividad del Sistema</h3>
            {error && <p className="text-danger text-center mb-4">{error}</p>}
            
            <div className="bg-dark-secondary rounded-lg overflow-hidden shadow-lg">
                <div className="max-h-[65vh] overflow-y-auto">
                    <table className="min-w-full text-left">
                        <thead className="bg-gray-700/50 sticky top-0">
                            <tr>
                                <th className="p-3">Fecha y Hora</th>
                                <th className="p-3">Usuario</th>
                                <th className="p-3">Acción</th>
                                <th className="p-3">Detalles</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center p-8">Cargando...</td></tr>
                            ) : logs.length > 0 ? logs.map(log => (
                                <tr key={log._id} className="hover:bg-gray-700/30 text-sm">
                                    <td className="p-3 font-mono whitespace-nowrap">{format(new Date(log.timestamp), 'dd/MM/yy HH:mm:ss', { locale: es })}</td>
                                    <td className="p-3 font-semibold">{log.user.username}</td>
                                    <td className="p-3"><span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">{log.action.replace(/_/g, ' ')}</span></td>
                                    <td className="p-3 text-text-secondary">{log.details}</td>
                                </tr>
                            )) : (
                                <tr><td colSpan="4" className="text-center p-8">No hay registros de actividad.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
             <div className="flex justify-center items-center gap-4 mt-4">
                <button onClick={() => setPage(p => p - 1)} disabled={page <= 1 || loading} className="px-4 py-2 bg-primary rounded disabled:opacity-50">Anterior</button>
                <span className="font-bold">Página {page} de {totalPages}</span>
                <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages || loading} className="px-4 py-2 bg-primary rounded disabled:opacity-50">Siguiente</button>
            </div>
        </div>
    );
};

export default ActivityLogViewer;