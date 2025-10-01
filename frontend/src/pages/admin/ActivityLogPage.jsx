import React, { useState, useEffect } from 'react';
import { logService } from '../../services/logService';
import { format } from 'date-fns';

const ActivityLogPage = () => {
  const [logData, setLogData] = useState({ logs: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await logService.getLogs(currentPage);
        setLogData(data);
      } catch (err) {
        setError('No se pudo cargar el registro de actividad.');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [currentPage]);

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, logData.totalPages));
  };

  if (loading && currentPage === 1) return <div className="text-center p-8">Cargando actividad...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Registro de Actividad</h1>

      <div className="bg-dark-secondary shadow-lg rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs text-text-primary uppercase bg-dark-primary">
            <tr>
              <th scope="col" className="px-6 py-3">Fecha y Hora</th>
              <th scope="col" className="px-6 py-3">Usuario</th>
              <th scope="col" className="px-6 py-3">Acción</th>
              <th scope="col" className="px-6 py-3">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logData.logs.map((log) => (
              <tr key={log._id} className="border-b border-gray-700 hover:bg-dark-primary">
                <td className="px-6 py-4 font-mono text-xs">{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</td>
                <td className="px-6 py-4 font-medium text-text-primary">{log.username}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-dark-primary text-text-secondary">
                      {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">{log.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <button
          onClick={handlePrevPage}
          disabled={currentPage === 1 || loading}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-text-secondary">
          Página {logData.page} de {logData.totalPages}
        </span>
        <button
          onClick={handleNextPage}
          disabled={currentPage === logData.totalPages || loading}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md disabled:opacity-50"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ActivityLogPage;
