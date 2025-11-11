import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { paymentService } from '../../services/paymentService'; // Importamos el servicio de pago
import socket from '../../services/socketService';
import { format } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { PencilIcon, XCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/solid';
import BookingFormModal from '../../components/admin/BookingFormModal';
import FullScreenQRModal from '../../components/admin/FullScreenQRModal'; // Importamos el Modal QR

// --- Componente de Acciones de Pago (Sin cambios) ---
const PaymentActions = ({ booking, onUpdate, onShowQR }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (booking.isPaid) {
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-dark-primary`}>
        Pagado ({booking.paymentMethod})
      </span>
    );
  }

  const handlePayment = (method) => {
    onUpdate(booking._id, 'Confirmed', true, method);
    setIsOpen(false);
  };
  
  const handleQRClick = () => {
    onShowQR(booking); // Llamamos a la función del padre
    setIsOpen(false);
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 text-xs font-semibold rounded-full bg-gray-500 text-white`}>
        Pendiente
      </span>
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          // --- Añadimos onBlur para cerrar si se hace clic fuera ---
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          className="text-secondary hover:text-green-400" 
          title="Marcar como Pagado"
        >
          <CurrencyDollarIcon className="h-6 w-6" />
        </button>
        
        {isOpen && (
          // --- POSICIÓN CORREGIDA: 'top-full' (abajo) y 'mt-2' ---
          <div className="absolute top-full mt-2 right-0 bg-dark-primary border border-gray-600 rounded-md shadow-lg z-10 w-36">
            <button onClick={() => handlePayment('Efectivo')} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-primary-dark">Efectivo</button>
            <button onClick={() => handlePayment('Transferencia')} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-primary-dark">Transferencia</button>
            <button onClick={handleQRClick} className="block w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-primary-dark">QR</button>
          </div>
        )}
      </div>
    </div>
  );
};
// ---------------------------------------------


const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // --- NUEVOS ESTADOS PARA EL MODAL QR ---
  const [qrData, setQrData] = useState({
    qrValue: '',
    total: 0,
    status: 'idle',
    bookingId: null // Para saber qué reserva estamos cobrando
  });
  // -------------------------------------

  const timeZone = 'America/Argentina/Buenos_Aires';

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

  useEffect(() => {
    socket.connect();
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
        
        // --- LÓGICA DE SOCKET PARA EL MODAL QR ---
        if (
            qrData.bookingId === updatedBooking._id && 
            updatedBooking.isPaid &&
            qrData.status === 'pending'
        ) {
            setQrData(prev => ({ ...prev, status: 'successful' }));
        }
        // ----------------------------------------
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
  }, [qrData.bookingId, qrData.status]); // <-- Dependencias de useEffect

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

  // --- ¡AQUÍ ESTÁ LA CORRECCIÓN DEL BUG (Punto 4)! ---
  const handleUpdateStatus = async (id, status, isPaid, paymentMethod) => {
    try {
        // 1. Esperamos a que la API nos devuelva el turno actualizado
        const updatedBooking = await bookingService.updateBookingStatus(id, { status, isPaid, paymentMethod });
        
        // 2. Actualizamos el estado de 'bookings' en React manualmente
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b._id === updatedBooking._id ? updatedBooking : b
          )
        );
        // Esto da una respuesta visual instantánea
        
    } catch (err) {
        alert('Error al actualizar la reserva.');
    }
  };
  // ------------------------------------------------

  const handleCancel = async (id) => {
      if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
          try {
              await bookingService.cancelBooking(id);
              // El socket (handleBookingUpdate) se encargará de actualizar la UI aquí
          } catch (err) {
              alert('Error al cancelar la reserva.');
          }
      }
  };

  // --- (Función handleShowQR sin cambios) ---
  const handleShowQR = async (booking) => {
    setLoading(true);
    setQrData({ qrValue: '', total: booking.price, status: 'idle', bookingId: booking._id });
    
    try {
        const paymentData = {
          items: [{
            title: `Pago de reserva para ${booking.user.name}`,
            unit_price: booking.price,
            quantity: 1,
          }],
          payer: { name: booking.user.name, email: "test_user@test.com" },
          metadata: { 
            booking_id: booking._id, 
          }
        };

        const preference = await paymentService.createPaymentPreference(paymentData);
        
        setQrData({
            qrValue: preference.init_point,
            total: booking.price,
            status: 'pending',
            bookingId: booking._id
        });

    } catch (err) {
        alert('Error al generar el QR de Mercado Pago.');
    } finally {
        setLoading(false);
    }
  };

  const handleCloseQRModal = () => {
    setQrData({ qrValue: '', total: 0, status: 'idle', bookingId: null });
  };
  
  // Helper para limpiar el número de WhatsApp
  const cleanPhoneNumber = (number) => {
    return (number || '').replace(/[^0-9]/g, ''); 
  };

  if (loading && bookings.length === 0) return <div className="text-center p-8">Cargando reservas...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Gestión de Turnos</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Añadir Turno
        </button>
      </div>

      {/* --- (Aquí irán los filtros del Punto 3) --- */}

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
            {bookings.map((booking) => {
              const zonedStartTime = utcToZonedTime(new Date(booking.startTime), timeZone);
              const zonedEndTime = utcToZonedTime(new Date(booking.endTime), timeZone);
              const whatsappLink = `https://wa.me/${cleanPhoneNumber(booking.user.phone)}`;

              return (
                <tr key={booking._id} className="border-b border-gray-700 hover:bg-dark-primary">
                  <td className="px-6 py-4 font-medium text-text-primary">
                    <a 
                      href={whatsappLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors"
                      title={`Enviar WhatsApp a ${booking.user.name}`}
                    >
                      {booking.user.name}
                    </a>
                  </td>
                  <td className="px-6 py-4">{booking.court?.name || 'N/A'}</td>
                  <td className="px-6 py-4">
                      {format(zonedStartTime, 'dd/MM/yyyy HH:mm')} - {format(zonedEndTime, 'HH:mm')}
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
                       <PaymentActions 
                         booking={booking} 
                         onUpdate={handleUpdateStatus}
                         onShowQR={handleShowQR} 
                       />
                  </td>
                  <td className="px-6 py-4 flex items-center gap-4">
                    <button onClick={() => handleOpenModal(booking)} className="text-blue-400 hover:text-blue-300" title="Editar Turno">
                        <PencilIcon className="h-5 w-5" />
                    </button>
                    {booking.status === 'Confirmed' && (
                         <button onClick={() => handleCancel(booking._id)} className="text-danger hover:text-red-400" title="Cancelar Reserva">
                            <XCircleIcon className="h-5 w-5" />
                        </button>
                    )}
                </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <BookingFormModal
          booking={selectedBooking}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}

      {qrData.qrValue && (
        <FullScreenQRModal
          qrValue={qrData.qrValue}
          total={qrData.total}
          status={qrData.status}
          onClose={handleCloseQRModal}
        />
      )}
    </div>
  );
};

export default BookingsPage;
