import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const CashboxPage = () => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCurrentSession = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/cashbox/session');
      setSession(data);
      setError(null);
    } catch (err) {
      if (err.response && err.response.status === 404) {
        setSession(null); // No active session
      } else {
        setError('Error al obtener la sesión de caja');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentSession();
  }, []);

  const handleOpenCashbox = async () => {
    const initialBalance = prompt('Ingrese el saldo inicial:');
    if (initialBalance) {
      try {
        const { data } = await api.post('/cashbox/open', { initialBalance: parseFloat(initialBalance) });
        setSession(data);
        setError(null);
      } catch (err) {
        setError('Error al abrir la caja');
      }
    }
  };

  const handleCloseCashbox = async () => {
    if (window.confirm('¿Está seguro de que desea cerrar la caja?')) {
      try {
        await api.post('/cashbox/close');
        setSession(null);
        setError(null);
        alert('Caja cerrada exitosamente.');
      } catch (err) {
        setError('Error al cerrar la caja');
      }
    }
  };

  if (loading) {
    return <p>Cargando...</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Gestión de Caja</h1>
      {error && <p className="text-red-500">{error}</p>}

      {session ? (
        <div>
          <p>Caja abierta</p>
          <p>Saldo Inicial: ${session.initialBalance.toFixed(2)}</p>
          <p>Fecha de Apertura: {new Date(session.openedAt).toLocaleString()}</p>
          <button
            onClick={handleCloseCashbox}
            className="bg-red-500 text-white px-4 py-2 rounded mt-4"
          >
            Cerrar Caja
          </button>
        </div>
      ) : (
        <div>
          <p>No hay una sesión de caja activa.</p>
          <button
            onClick={handleOpenCashbox}
            className="bg-green-500 text-white px-4 py-2 rounded mt-4"
          >
            Abrir Caja
          </button>
        </div>
      )}
    </div>
  );
};

export default CashboxPage;