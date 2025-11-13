import React, { useState, useEffect } from 'react';
import { recurringBookingService } from '../../services/recurringBookingService';
import { PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import RecurringBookingFormModal from '../../components/admin/RecurringBookingFormModal';
import { format } from 'date-fns';

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const RecurringBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const data = await recurringBookingService.getRecurringBookings();
      setBookings(data);
    } catch (err) {
      setError('No se pudieron cargar las reservas recurrentes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleOpenModal = (booking = null) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };

  const handleSuccess = () => {
    fetchBookings();
    handleCloseModal();
  };

  const handleToggle = async (id) => {
    try {
      await recurringBookingService.toggleRecurringBooking(id);
      fetchBookings();
    } catch (err) {
      alert('Error al cambiar el estado de la reserva.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta reserva recurrente?')) {
      try {
        await recurringBookingService.deleteRecurringBooking(id);
        fetchBookings();
      } catch (err) {
        alert('Error al eliminar la reserva recurrente.');
      }
    }
  };

  if (loading) return <div className="text-center p-8">Cargando reservas recurrentes...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div>
      {/* --- HEADER MODIFICADO --- */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Reservas Recurrentes (Turnos Fijos)</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors w-full md:w-auto"
        >
          Añadir Turno Fijo
        </button>
      </div>

      <div className="bg-dark-secondary shadow-lg rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs text-text-primary uppercase bg-dark-primary">
            <tr>
              <th scope="col" className="px-6 py-3">Cliente</th>
              <th scope="col" className"px-6 py-3">Cancha</th>
              <th scope="col" className="px-6 py-3">Día</th>
              <th scope="col" className="px-6 py-3">Hora</th>
              <th scope="col" className="px-6 py-3">Duración</th>
              <th scope="col" className="px-6 py-3">Vigencia</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking._id} className="border-b border-gray-700 hover:bg-dark-primary">
                  <td className="px-6 py-4 font-medium text-text-primary">{booking.user.name}</td>
                  <td className="px-6 py-4">{booking.court?.name || 'N/A'}</td>
                  <td className="px-6 py-4 font-semibold">{days[booking.dayOfWeek]}</td>
                  <td className="px-6 py-4">{booking.startTime}</td>
                  <td className="px-6 py-4">{booking.duration} min</td>
                  <td className="px-6 py-4 text-xs">
                    Desde: {format(new Date(booking.startDate), 'dd/MM/yy')}
                    <br />
                    Hasta: {booking.endDate ? format(new Date(booking.endDate), 'dd/MM/yy') : 'Indefinido'}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(booking._id)}
                      className="flex items-center gap-2"
                      title={booking.isActive ? 'Desactivar' : 'Activar'}
                    >
                      {booking.isActive ? (
                        <>
                          <CheckCircleIcon className="h-5 w-5 text-secondary" />
                          <span className="text-secondary">Activo</span>
                        </>
                      ) : (
                        <>
                          <XCircleIcon className="h-5 w-5 text-danger" />
                          <span className="text-danger">Inactivo</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    <button onClick={() => handleOpenModal(booking)} className="text-blue-400 hover:text-blue-300" title="Editar">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(booking._id)} className="text-danger hover:text-red-400" title="Eliminar">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center p-8 text-text-secondary">
                  No hay reservas recurrentes configuradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <RecurringBookingFormModal
          booking={selectedBooking}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default RecurringBookingsPage;
