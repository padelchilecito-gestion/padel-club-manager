import React, { useState, useEffect, useCallback } from 'react';
import { cashboxService } from '../../services/cashboxService';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';

const timeZone = 'America/Argentina/Buenos_Aires';

// --- Componente: Formulario para Abrir Caja ---
const OpenCashboxForm = ({ onSessionStarted, lastSession }) => {
  const [startAmount, setStartAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(startAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Por favor, ingresa un monto inicial válido.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await cashboxService.startCashboxSession(amount);
      onSessionStarted();
    } catch (err) {
      setError(err.message || 'Error al abrir la caja.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-primary mb-6">Abrir Caja</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="startAmount" className="block text-sm font-medium text-text-secondary">Fondo Inicial (ARS)</label>
            <input
              type="number"
              id="startAmount"
              value={startAmount}
              onChange={(e) => setStartAmount(e.target.value)}
              required
              min="0"
              step="0.01"
              placeholder="Ej: 5000"
              className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
            />
          </div>
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-3 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors disabled:opacity-50"
          >
            {saving ? 'Abriendo...' : 'Iniciar Sesión de Caja'}
          </button>
        </form>
      </div>
      <LastSessionSummary lastSession={lastSession} />
    </div>
  );
};

// --- Componente: Formulario para Cerrar Caja ---
const CloseCashboxForm = ({ session, onSessionClosed }) => {
  const [endAmount, setEndAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(endAmount);
    if (isNaN(amount) || amount < 0) {
      setError('Por favor, ingresa un monto final válido.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      await cashboxService.closeCashboxSession(amount, notes);
      onSessionClosed();
    } catch (err) {
      setError(err.message || 'Error al cerrar la caja.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-dark-secondary p-8 rounded-lg shadow-lg max-w-lg mx-auto">
      <h2 className="text-2xl font-bold text-danger mb-6">Cerrar Caja</h2>
      <div className="mb-4 bg-dark-primary p-4 rounded-md">
        <p className="text-text-secondary">Fondo Inicial de esta sesión:</p>
        <p className="text-2xl font-bold text-primary">${session.startAmount.toFixed(2)}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="endAmount" className="block text-sm font-medium text-text-secondary">Monto Final Contado (ARS)</label>
          <input
            type="number"
            id="endAmount"
            value={endAmount}
            onChange={(e) => setEndAmount(e.target.value)}
            required
            min="0"
            step="0.01"
            placeholder="Monto contado en caja"
            className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-text-secondary">Notas (Opcional)</label>
          <textarea
            id="notes"
            rows="3"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ej: Faltante de $50 justificado por..."
            className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
          />
        </div>
        {error && <p className="text-danger text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full px-4 py-3 bg-danger hover:bg-red-700 text-white font-bold rounded-md transition-colors disabled:opacity-50"
        >
          {saving ? 'Cerrando...' : 'Cerrar Sesión de Caja'}
        </button>
      </form>
    </div>
  );
};

// --- Componente: Resumen del Último Cierre ---
const LastSessionSummary = ({ lastSession }) => {
  if (!lastSession) {
    return (
      <div className="bg-dark-secondary p-8 rounded-lg shadow-lg h-full">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Último Cierre</h3>
        <p className="text-text-secondary">No se encontró ninguna sesión de caja cerrada.</p>
      </div>
    );
  }

  const { summary, startAmount, endAmount, notes, endTime } = lastSession;
  const zonedEndTime = utcToZonedTime(new Date(endTime), timeZone);
  const diffColor = summary.difference === 0 ? 'text-secondary' : summary.difference > 0 ? 'text-blue-400' : 'text-danger';

  return (
    <div className="bg-dark-secondary p-8 rounded-lg shadow-lg">
      <h3 className="text-xl font-semibold text-text-primary mb-4">
        Último Cierre ({format(zonedEndTime, 'dd/MM/yyyy HH:mm')})
      </h3>
      <div className="space-y-2 text-text-primary">
        <SummaryRow label="Fondo Inicial" value={startAmount} />
        <SummaryRow label="Ventas (Efectivo)" value={summary.totalCashSales} />
        <SummaryRow label="Turnos (Efectivo)" value={summary.totalCashBookings} />
        <hr className="border-gray-600 my-2" />
        <SummaryRow label="Total Esperado" value={summary.expectedCash} isBold={true} />
        <SummaryRow label="Total Contado" value={endAmount} isBold={true} />
        <hr className="border-gray-600 my-2" />
        <SummaryRow label="Diferencia" value={summary.difference} color={diffColor} isBold={true} />
      </div>
      {notes && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-text-secondary">Notas del Cierre:</p>
          <p className="text-sm text-text-primary bg-dark-primary p-2 rounded-md mt-1">{notes}</p>
        </div>
      )}
    </div>
  );
};

const SummaryRow = ({ label, value, color = 'text-text-primary', isBold = false }) => (
  <div className={`flex justify-between ${isBold ? 'font-bold' : ''}`}>
    <span>{label}:</span>
    <span className={color}>${value.toFixed(2)}</span>
  </div>
);

// --- Página Principal ---
const CashboxPage = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [lastClosedSession, setLastClosedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const session = await cashboxService.getCurrentSession();
      setCurrentSession(session); // Será null si no hay ninguna
      
      if (!session) {
        // Si no hay sesión abierta, buscamos la última cerrada
        const lastSession = await cashboxService.getLastClosedSession();
        setLastClosedSession(lastSession);
      }
    } catch (err) {
      setError('No se pudo cargar el estado de la caja.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="text-center p-8">Cargando estado de la caja...</div>;
  }

  if (error) {
    return <div className="text-center p-8 text-danger">{error}</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-text-primary mb-6">Gestión de Caja</h1>
      
      {currentSession ? (
        <CloseCashboxForm session={currentSession} onSessionClosed={loadData} />
      ) : (
        <OpenCashboxForm onSessionStarted={loadData} lastSession={lastClosedSession} />
      )}
    </div>
  );
};

export default CashboxPage;
