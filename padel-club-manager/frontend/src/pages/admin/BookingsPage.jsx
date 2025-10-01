import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import socket from '../../services/socketService';
import { format } from 'date-fns';
import { CheckCircleIcon, XCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Connect to socket server
    socket.connect();

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getAllBookings();
        setBookings(data);
      } catch (err) {
        setError('No se pudieron cargar las reservas.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();

    // Listen for real-time updates
    const handleBookingUpdate = (updatedBooking) => {
        setBookings(prevBookings => {
            const index = prevBookings.findIndex(b => b._id === updatedBooking._id);
            if (index !== -1) {
                // Update existing booking
                const newBookings = [...prevBookings];
                newBookings[index] = updatedBooking;
                return newBookings;
            } else {
                // Add new booking and sort
                return [...prevBookings, updatedBooking].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            }
        });
    };

    const handleBookingDelete = ({ id }) => {
        setBookings(prevBookings => prevBookings.filter(b => b._id !== id));
    };

    socket.on('booking_update', handleBookingUpdate);
    socket.on('booking_deleted', handleBookingDelete);

    // Disconnect on component unmount
    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.off('booking_deleted', handleBookingDelete);
      socket.disconnect();
    };
  }, []);

  const handleUpdateStatus = async (id, newStatus, isPaid) => {
    try {
        await bookingService.updateBookingStatus(id, { status: newStatus, isPaid });
        // The state will be updated via the socket event, so no need to manually update here.
    } catch (err) {
        alert('Error al actualizar la reserva.');
    }
  };

  const handleCancel = async (id) => {
      if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
          try {
              await bookingService.cancelBooking(id);
          } catch (err) {
              alert('Error al cancelar la reserva.');
          }
      }
  };

  if (loading) return <div className="text-center p-8">Cargando reservas...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Gestión de Turnos</h1>
        {/* TODO: Add a "New Booking" button here that opens a modal */}
      </div>

      <div className="bg-dark-secondary shadow-lg rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs text-text-primary uppercase bg-dark-primary">
            <tr>
              <th scope="col" className="px-6 py-3">Cliente</th>
              <th scope="col" className="px-6 py-3">Cancha</th>
              <th scope="col" className="px-6 py-3">Horario</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3">Pago</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking._id} className="border-b border-gray-700 hover:bg-dark-primary">
                <td className="px-6 py-4 font-medium text-text-primary">{booking.user.name}</td>
                <td className="px-6 py-4">{booking.court?.name || 'N/A'}</td>
                <td className="px-6 py-4">
                    {format(new Date(booking.startTime), 'dd/MM/yyyy HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                </td>
                <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'Confirmed' ? 'bg-green-500 text-white' :
                        booking.status === 'Cancelled' ? 'bg-danger text-white' : 'bg-yellow-500 text-dark-primary'
                    }`}>
                        {booking.status}
                    </span>
                </td>
                <td className="px-6 py-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.isPaid ? 'bg-secondary text-dark-primary' : 'bg-gray-500 text-white'
                    }`}>
                        {booking.isPaid ? `Pagado (${booking.paymentMethod})` : 'Pendiente'}
                    </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-2">
                    {!booking.isPaid && booking.status === 'Confirmed' && (
                         <button onClick={() => handleUpdateStatus(booking._id, 'Confirmed', true)} className="text-secondary hover:text-green-400" title="Marcar como Pagado">
                            <CurrencyDollarIcon className="h-5 w-5" />
                        </button>
                    )}
                    {booking.status === 'Confirmed' && (
                         <button onClick={() => handleCancel(booking._id)} className="text-danger hover:text-red-400" title="Cancelar Reserva">
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BookingsPage;