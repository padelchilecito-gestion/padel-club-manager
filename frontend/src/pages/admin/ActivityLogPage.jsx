import React, { useState, useEffect, useCallback } from 'react';
import { logService } from '../../services/logService';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const timeZone = 'America/Argentina/Buenos_Aires';

// Componente para mostrar un "badge" de color según la acción
const ActionBadge = ({ action }) => {
  let color = 'bg-gray-500 text-white'; // Default
  if (action.includes('CREATED') || action.includes('OPENED') || action.includes('REGISTERED')) {
    color = 'bg-secondary text-dark-primary'; // Verde
  } else if (action.includes('UPDATED')) {
    color = 'bg-blue-400 text-white'; // Azul
  } else if (action.includes('DELETED') || action.includes('CANCELLED') || action.includes('CLOSED')) {
    color = 'bg-danger text-white'; // Rojo
  } else if (action.includes('LOGIN')) {
    color = 'bg-primary text-white'; // Naranja
  }

  return (
    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
      {action}
    </span>
  );
};

const ActivityLogPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);

  const fetchLogs = useCallback(async (page) => {
    setLoading(true);
    setError('');
    try {
      // El servicio y el backend ya soportan paginación
      const data = await logService.getLogs(page);
      setLogs(data.logs);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalLogs(data.totalLogs);
    } catch (err) {
      setError('No se pudieron cargar los registros de actividad.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs(1); // Cargar la primera página al montar
  }, [fetchLogs]);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      fetchLogs(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      fetchLogs(currentPage - 1);
    }
  };

  if (loading && logs.length === 0) {
    return <div className="text-center p-8">Cargando registros...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-danger">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Registro de Actividad del Sistema</h1>

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
            {logs.map((log) => {
              const zonedTime = utcToZonedTime(new Date(log.timestamp), timeZone);
              return (
                <tr key={log._id} className="border-b border-gray-700 hover:bg-dark-primary">
                  <td className="px-6 py-4 font-mono">
                    {format(zonedTime, 'dd/MM/yyyy HH:mm:ss')}
                  </td>
                  <td className="px-6 py-4 font-medium text-text-primary">
                    {log.username}
                  </td>
                  <td className="px-6 py-4">
                    <ActionBadge action={log.action} />
                  </td>
                  <td className="px-6 py-4">
                    {log.details}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* --- Paginación --- */}
      <div className="flex justify-between items-center bg-dark-secondary px-6 py-3 rounded-b-lg border-t border-gray-700">
        <span className="text-sm text-text-secondary">
          Total de registros: {totalLogs}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-4 w-4 mr-1" />
            Anterior
          </button>
          <span className="text-text-primary font-semibold">
            Página {currentPage} de {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages || loading}
            className="flex items-center px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-md disabled:opacity-50"
          >
            Siguiente
            <ChevronRightIcon className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogPage;
