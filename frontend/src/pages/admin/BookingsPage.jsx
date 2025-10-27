import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { bookingService } from '../../services/bookingService';
import socket from '../../services/socketService';
import { format } from 'date-fns';
import { 
  XCircleIcon, 
  CurrencyDollarIcon, 
  ChatBubbleBottomCenterTextIcon,
  BanknotesIcon,
  QrCodeIcon 
} from '@heroicons/react/24/solid';
// --- 1. IMPORTAR EL NUEVO MODAL ---
import PaymentQRModal from '../../components/admin/PaymentQRModal';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  // --- 2. AÑADIR ESTADOS PARA EL MODAL ---
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
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

    const handleBookingUpdate = (updatedBooking) => {
        setBookings(prevBookings => {
            const index = prevBookings.findIndex(b => b._id === updatedBooking._id);
            if (index !== -1) {
                const newBookings = [...prevBookings];
                newBookings[index] = updatedBooking;
                return newBookings;
            } else {
                return [...prevBookings, updatedBooking].sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
            }
        });
    };

    const handleBookingDelete = ({ id }) => {
        setBookings(prevBookings => prevBookings.filter(b => b._id !== id));
    };

    socket.on('booking_update', handleBookingUpdate);
    socket.on('booking_deleted', handleBookingDelete);

    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.off('booking_deleted', handleBookingDelete);
      socket.disconnect();
    };
  }, [location.pathname]);

  // Esta función ahora solo maneja pagos MANUALES (Efectivo, Transferencia)
  const handleManualPayment = async (id, paymentMethod) => {
    if (!paymentMethod) {
      alert('Error: Método de pago no especificado.');
      return;
    }
    try {
        await bookingService.updateBookingStatus(id, { 
          status: 'Confirmed', 
          isPaid: true, 
          paymentMethod: paymentMethod 
        });
    } catch (err) {
        alert('Error al actualizar el pago.');
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

  // --- 3. FUNCIÓN PARA ABRIR EL MODAL QR ---
  const handleOpenQrModal = (booking) => {
    setSelectedBooking(booking);
    setQrModalOpen(true);
  };
  
  // Función para cerrar el modal
  const handleCloseQrModal = (paymentSuccess) => {
    setQrModalOpen(false);
    setSelectedBooking(null);
    // (No necesitamos refrescar, el socket.io ya actualizó la lista en 'handleBookingUpdate')
  };

  if (loading) return <div className="text-center p-8">Cargando reservas...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-4 md:mb-0">Gestión de Turnos</h1>
      </div>

      <div className="bg-dark-secondary shadow-2xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-primary uppercase bg-dark-primary/50">
              <tr>
                <th scope="col" className="px-6 py-4">Cliente</th>
                <th scope="col" className="px-6 py-4 hidden sm:table-cell">Cancha</th>
                <th scope="col" className="px-6 py-4">Horario</th>
                <th scope="col" className="px-6 py-4">Estado</th>
                <th scope="col" className="px-6 py-4 hidden md:table-cell">Pago</th>
                <th scope="col" className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {bookings.map((booking) => (
                <tr key={booking._id} className="hover:bg-dark-primary/50 transition-colors">
                  
                  <td className="px-6 py-4 font-medium text-text-primary whitespace-nowrap">
                    <a
                      href={`https://wa.me/${booking.user.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Enviar WhatsApp a ${booking.user.name}`}
                      className="flex items-center gap-2 hover:text-secondary transition-colors"
                    >
                      <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-green-light" />
                      {`${booking.user.name} ${booking.user.lastName || ''}`}
                    </a>
                  </td>

                  <td className="px-6 py-4 hidden sm:table-cell">{booking.court?.name || 'N/a'}</td>
                  <td className="px-6 py-4">
                      {format(new Date(booking.startTime), 'dd/MM/yy HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                  </td>
                  <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          booking.status === 'Confirmed' ? 'bg-green-dark text-white' :
                          booking.status === 'Cancelled' ? 'bg-danger text-white' : 
                          booking.status === 'Completed' ? 'bg-blue-dark text-white' : 
                          booking.status === 'NoShow' ? 'bg-gray-light text-dark-primary' : 
                          'bg-yellow-dark text-dark-primary' // Pending
                      }`}>
                          {booking.status}
                      </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                       <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                          booking.isPaid ? 'bg-secondary text-dark-primary' : 'bg-gray-light text-white'
                      }`}>
                          {/* --- 4. TEXTO DE PAGO MEJORADO --- */}
                          {booking.isPaid ? `Pagado (${booking.paymentMethod || 'N/A'})` : 'Pendiente'}
                       </span>
                  </td>
                  
                  <td className="px-6 py-4 flex items-center justify-center gap-3">
                      {!booking.isPaid && (booking.status === 'Confirmed' || booking.status === 'Pending') && (
                           <>
                            {/* Botón Efectivo (Manual) */}
                            <button onClick={() => handleManualPayment(booking._id, 'Efectivo')} className="text-green-light hover:text-green-dark transition-colors" title="Pagar con Efectivo">
                                <CurrencyDollarIcon className="h-6 w-6" />
                            </button>
                            {/* Botón Transferencia (Manual) */}
                             <button onClick={() => handleManualPayment(booking._id, 'Transferencia')} className="text-blue-400 hover:text-blue-300 transition-colors" title="Pagar con Transferencia">
                                <BanknotesIcon className="h-6 w-6" />
                            </button>
                            {/* --- 5. BOTÓN QR ABRE EL MODAL --- */}
                             <button onClick={() => handleOpenQrModal(booking)} className="text-cyan-400 hover:text-cyan-300 transition-colors" title="Pagar con QR Mercado Pago">
                                <QrCodeIcon className="h-6 w-6" />
                            </button>
                           </>
                      )}
                      {booking.status !== 'Cancelled' && (
                           <button onClick={() => handleCancel(booking._id)} className="text-danger hover:text-red-400 transition-colors" title="Cancelar Reserva">
                              <XCircleIcon className="h-6 w-6" />
                          </button>
                      )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* --- 6. RENDERIZAR EL MODAL --- */}
      {qrModalOpen && selectedBooking && (
        <PaymentQRModal 
          booking={selectedBooking} 
          onClose={handleCloseQrModal} 
        />
      )}
    </div>
  );
};

export default BookingsPage;
