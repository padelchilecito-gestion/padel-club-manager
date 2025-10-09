import React, { useEffect, useState, useCallback } from 'react';
import { bookingService } from '../../services/bookingService';
import { toast } from 'react-toastify';
import ConfirmationModal from '../../components/common/ConfirmationModal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { courtService } from '../../services/courtService';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirmCancelModal, setShowConfirmCancelModal] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingToPay, setBookingToPay] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCourt, setFilterCourt] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [courts, setCourts] = useState([]);

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {
        status: filterStatus,
        courtId: filterCourt,
        date: filterDate,
      };
      const data = await bookingService.getAllBookingsAdmin(currentPage, limit, filters);
      setBookings(data.docs);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError('Error al cargar las reservas.');
      toast.error('Error al cargar las reservas.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, filterStatus, filterCourt, filterDate]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    const loadCourts = async () => {
      try {
        const data = await courtService.getAllCourts();
        setCourts(data);
      } catch (err) {
        console.error("Error loading courts for filter:", err);
      }
    };
    loadCourts();
  }, []);

  const handleUpdateStatus = async (id, status, isPaid, paymentMethod) => {
    try {
        const updatedBooking = await bookingService.updateBookingStatus(id, { status, isPaid, paymentMethod });
        setBookings(prevBookings =>
            prevBookings.map(b => b._id === id ? updatedBooking : b)
        );
        toast.success('Estado de reserva actualizado.');
    } catch (err) {
        toast.error('Error al actualizar la reserva.');
    }
  };

  const handleCancel = async (id) => {
    try {
        const updatedBooking = await bookingService.cancelBooking(id);
        setBookings(prevBookings =>
            prevBookings.map(b => b._id === id ? updatedBooking : b)
        );
        toast.success('Reserva cancelada exitosamente.');
        fetchBookings();
    } catch (err) {
        toast.error('Error al cancelar la reserva.');
    }
  };

  const confirmCancel = async () => {
    if (bookingToCancel) {
      await handleCancel(bookingToCancel._id);
      setShowConfirmCancelModal(false);
      setBookingToCancel(null);
    }
  };

  const goToPage = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-dark-secondary rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-primary mb-6">Gestión de Turnos</h2>

      <div className="bg-dark-primary p-4 rounded-lg mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="filterStatus" className="block text-sm font-medium text-text-secondary mb-1">Estado</label>
          <select
            id="filterStatus"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-dark-secondary border border-gray-600 rounded-md p-2 text-text-primary"
          >
            <option value="">Todos</option>
            <option value="Confirmed">Confirmado</option>
            <option value="Pending">Pendiente</option>
            <option value="Cancelled">Cancelado</option>
            <option value="Finalizado">Finalizado</option>
            <option value="Cancelled with Penalty">Cancelado con Penalización</option>
          </select>
        </div>
        <div>
          <label htmlFor="filterCourt" className="block text-sm font-medium text-text-secondary mb-1">Cancha</label>
          <select
            id="filterCourt"
            value={filterCourt}
            onChange={(e) => setFilterCourt(e.target.value)}
            className="w-full bg-dark-secondary border border-gray-600 rounded-md p-2 text-text-primary"
          >
            <option value="">Todas</option>
            {courts.map(court => (
              <option key={court._id} value={court._id}>{court.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filterDate" className="block text-sm font-medium text-text-secondary mb-1">Fecha</label>
          <input
            type="date"
            id="filterDate"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full bg-dark-secondary border border-gray-600 rounded-md p-2 text-text-primary"
          />
        </div>
      </div>

      {error && <p className="text-danger mb-4">{error}</p>}

      {loading ? (
        <p className="text-text-secondary">Cargando reservas...</p>
      ) : bookings.length === 0 ? (
        <p className="text-text-secondary">No hay reservas para mostrar.</p>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking._id} className="bg-dark-primary p-4 rounded-lg shadow flex flex-col md:flex-row justify-between items-center">
              <div className="text-text-primary text-center md:text-left mb-2 md:mb-0 flex-1">
                <p className="font-semibold text-lg">{booking.court?.name || 'Cancha Desconocida'}</p>
                <p className="text-sm">
                  {format(new Date(booking.startTime), 'dd/MM/yyyy HH:mm', { locale: es })} - {format(new Date(booking.endTime), 'HH:mm', { locale: es })}
                </p>
                <p className="text-sm">Usuario: {booking.user?.name || booking.user?.username || 'Invitado'}</p>
                <p className="text-sm">Teléfono: {booking.user?.phone || 'N/A'}</p>
                <p className={`text-sm ${booking.status === 'Cancelled' || booking.status === 'Cancelled with Penalty' ? 'text-danger' : 'text-primary'}`}>
                  Estado: {booking.status}
                  {booking.status === 'Cancelled with Penalty' && booking.penaltyAmount && ` ($${booking.penaltyAmount.toFixed(2)} penalización)`}
                </p>
                <p className="text-sm">Método de pago: {booking.paymentMethod}</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-end gap-2">
                {booking.status === 'Pending' && (
                  <button
                    onClick={() => { setBookingToPay(booking); setShowPaymentModal(true); }}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    Registrar Pago
                  </button>
                )}
                {(booking.status === 'Confirmed' || booking.status === 'Pending') && (
                  <button
                    onClick={() => { setBookingToCancel(booking); setShowConfirmCancelModal(true); }}
                    className="bg-danger hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-6 space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-dark-primary text-text-primary rounded-md disabled:opacity-50"
          >
            Anterior
          </button>
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => goToPage(index + 1)}
              className={`px-4 py-2 rounded-md ${currentPage === index + 1 ? 'bg-primary text-white' : 'bg-dark-primary text-text-primary hover:bg-primary-dark'}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-dark-primary text-text-primary rounded-md disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      )}

      <ConfirmationModal
        show={showConfirmCancelModal}
        onClose={() => setShowConfirmCancelModal(false)}
        onConfirm={confirmCancel}
        title="Confirmar Cancelación"
        message={`¿Estás seguro de que quieres cancelar la reserva para el ${bookingToCancel ? format(new Date(bookingToCancel.startTime), 'dd/MM HH:mm') : ''} en la ${bookingToCancel?.court?.name || 'cancha desconocida'}?`}
      />
    </div>
  );
};

export default BookingsPage;