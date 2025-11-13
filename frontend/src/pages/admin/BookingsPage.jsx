import React, { useState, useEffect, useCallback } from 'react';
import { bookingService } from '../../services/bookingService';
import { courtService } from '../../services/courtService';
import { paymentService } from '../../services/paymentService'; 
import socket from '../../services/socketService';
import { format, startOfDay, isSameDay, parseISO } from 'date-fns';
import { utcToZonedTime } from 'date-fns-tz';
import { 
  PencilIcon, 
  XCircleIcon, 
  CurrencyDollarIcon, 
  FunnelIcon, 
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrashIcon, // <-- IMPORTAR ÍCONO DE BASURA
  ArrowPathIcon // <-- IMPORTAR ÍCONO DE RECURRENCIA
} from '@heroicons/react/24/solid'; 
import BookingFormModal from '../../components/admin/BookingFormModal';
import FullScreenQRModal from '../../components/admin/FullScreenQRModal'; 

// (Componente PaymentActions sin cambios)
const PaymentActions = ({ booking, onUpdate, onShowQR }) => {
  // ... (código existente) ...
};


const BookingsPage = () => {
  const [bookings, setBookings] = useState([]); 
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const [filters, setFilters] = useState({
    name: '',
    court: 'all',
    payment: 'all',
    date: format(new Date(), 'yyyy-MM-dd') 
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);

  const [qrData, setQrData] = useState({
    qrValue: '',
    total: 0,
    status: 'idle',
    bookingId: null 
  });

  const timeZone = 'America/Argentina/Buenos_Aires';

  const fetchBookings = useCallback(async (page, currentFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        limit: 15,
        ...currentFilters
      };
      
      const data = await bookingService.getBookings(params);
      
      setBookings(data.bookings);
      setCurrentPage(data.page);
      setTotalPages(data.totalPages);
      setTotalBookings(data.totalBookings);

    } catch (err) {
      setError('No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    const loadCourts = async () => {
      try {
        const courtsData = await courtService.getAllCourts();
        setCourts(courtsData);
      } catch (err) {
        console.error("Failed to load courts", err);
      }
    };
    loadCourts();
  }, []);

  useEffect(() => {
    fetchBookings(currentPage, filters);
  }, [filters, currentPage, fetchBookings]);


  // --- EFECTO DE SOCKET MODIFICADO ---
  useEffect(() => {
    socket.connect();

    const handleBookingUpdate = (updatedBooking) => {
        fetchBookings(currentPage, filters);
        
        if (
            qrData.bookingId === updatedBooking._id && 
            updatedBooking.isPaid &&
            qrData.status === 'pending'
        ) {
            setQrData(prev => ({ ...prev, status: 'successful' }));
        }
    };
    
    // Escuchamos el evento de eliminación simple Y el de serie
    const handleRefresh = () => {
      fetchBookings(currentPage, filters);
    };

    socket.on('booking_update', handleBookingUpdate);
    socket.on('booking_deleted', handleRefresh);
    socket.on('booking_series_deleted', handleRefresh); // <-- NUEVO EVENTO

    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.off('booking_deleted', handleRefresh);
      socket.off('booking_series_deleted', handleRefresh); // <-- LIMPIAR EVENTO
      socket.disconnect();
    };
  }, [currentPage, filters, fetchBookings, qrData.bookingId, qrData.status]);
  // ---------------------------------
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); 
  };

  const clearFilters = () => {
    setFilters({ 
      name: '', 
      court: 'all', 
      payment: 'all', 
      date: '' 
    });
    setCurrentPage(1);
  };
  
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleOpenModal = (booking = null) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };
  const handleSuccess = () => {
    fetchBookings(currentPage, filters);
    handleCloseModal();
  };
  const handleUpdateStatus = async (id, status, isPaid, paymentMethod) => {
    try {
        await bookingService.updateBookingStatus(id, { status, isPaid, paymentMethod });
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
  
  // --- NUEVO MANEJADOR PARA ELIMINAR SERIE ---
  const handleDeleteSeries = async (groupId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar la serie completa de turnos fijos? Esta acción es irreversible.')) {
      try {
        await bookingService.deleteRecurringBooking(groupId);
        // El socket refrescará la lista
      } catch (err) {
        alert('Error al eliminar la serie de reservas.');
      }
    }
  };
  // ------------------------------------------

  const handleShowQR = async (booking) => {
    // ... (código existente) ...
  };
  const handleCloseQRModal = () => {
    // ... (código existente) ...
  };
  const cleanPhoneNumber = (number) => {
    // ... (código existente) ...
  };

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

      {/* --- BARRA DE FILTROS (sin cambios) --- */}
      <div className="mb-6 p-4 bg-dark-secondary rounded-lg shadow-md ...">
        {/* ... (tu código de filtros) ... */}
      </div>

      {/* --- TABLA DE RESERVAS (Modificada) --- */}
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
            {loading ? (
              <tr><td colSpan="6" className="text-center p-8 text-text-secondary">Cargando...</td></tr>
            ) : error ? (
              <tr><td colSpan="6" className="text-center p-8 text-danger">{error}</td></tr>
            ) : bookings.length > 0 ? (
              bookings.map((booking) => {
                const zonedStartTime = utcToZonedTime(new Date(booking.startTime), timeZone);
                const zonedEndTime = utcToZonedTime(new Date(booking.endTime), timeZone);
                const whatsappLink = `https://wa.me/${cleanPhoneNumber(booking.user.phone)}`;

                return (
                  <tr key={booking._id} className="border-b border-gray-700 hover:bg-dark-primary">
                    <td className="px-6 py-4 font-medium text-text-primary">
                      {/* --- Indicador de Turno Fijo --- */}
                      {booking.recurringGroupId && (
                        <ArrowPathIcon className="h-4 w-4 inline-block mr-1 text-blue-400" title="Turno Fijo" />
                      )}
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
                      {/* --- ACCIONES MODIFICADAS --- */}
                      <button onClick={() => handleOpenModal(booking)} className="text-blue-400 hover:text-blue-300" title="Editar Turno">
                          <PencilIcon className="h-5 w-5" />
                      </button>
                      
                      {booking.status === 'Confirmed' && (
                           <button onClick={() => handleCancel(booking._id)} className="text-danger hover:text-red-400" title="Cancelar Reserva">
                              <XCircleIcon className="h-5 w-5" />
                          </button>
                      )}

                      {/* Botón para eliminar toda la serie */}
                      {booking.recurringGroupId && (
                        <button onClick={() => handleDeleteSeries(booking.recurringGroupId)} className="text-red-700 hover:text-red-400" title="Eliminar Serie Completa">
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                      {/* --------------------------- */}
                  </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center p-8 text-text-secondary">
                  No se encontraron reservas que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINACIÓN (sin cambios) --- */}
      <div className="flex justify-between items-center bg-dark-secondary ...">
        {/* ... (tu código de paginación) ... */}
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
