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
  ChevronRightIcon
} from '@heroicons/react/24/solid'; 
import BookingFormModal from '../../components/admin/BookingFormModal';
import FullScreenQRModal from '../../components/admin/FullScreenQRModal'; 

// (Componente PaymentActions sin cambios)
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
    onShowQR(booking); 
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
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          className="text-secondary hover:text-green-400" 
          title="Marcar como Pagado"
        >
          <CurrencyDollarIcon className="h-6 w-6" />
        </button>
        
        {isOpen && (
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


const BookingsPage = () => {
  const [bookings, setBookings] = useState([]); // ¡Ahora solo contiene la página actual!
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // --- ESTADOS DE FILTRO Y PAGINACIÓN ---
  const [filters, setFilters] = useState({
    name: '',
    court: 'all',
    payment: 'all',
    date: format(new Date(), 'yyyy-MM-dd') // Filtramos por hoy por defecto
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  // -----------------------------------

  const [qrData, setQrData] = useState({
    qrValue: '',
    total: 0,
    status: 'idle',
    bookingId: null 
  });

  const timeZone = 'America/Argentina/Buenos_Aires';

  // --- NUEVA FUNCIÓN DE CARGA DE DATOS ---
  const fetchBookings = useCallback(async (page, currentFilters) => {
    setLoading(true);
    setError('');
    try {
      // Preparamos los parámetros para la API
      const params = {
        page,
        limit: 15, // 15 por página
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
  }, []); // Sin dependencias, no necesita recrearse

  // Cargar canchas solo una vez al montar
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

  // Efecto para recargar datos cuando cambian los filtros o la página
  useEffect(() => {
    // Usamos 'filters' y 'currentPage' del estado
    fetchBookings(currentPage, filters);
  }, [filters, currentPage, fetchBookings]);
  // ----------------------------------------


  // (Efecto de Socket.IO modificado para recargar la página actual)
  useEffect(() => {
    socket.connect();

    const handleBookingUpdate = (updatedBooking) => {
        // Simple: solo recargamos la data de la página actual
        fetchBookings(currentPage, filters);
        
        // Lógica del QR (sin cambios)
        if (
            qrData.bookingId === updatedBooking._id && 
            updatedBooking.isPaid &&
            qrData.status === 'pending'
        ) {
            setQrData(prev => ({ ...prev, status: 'successful' }));
        }
    };
    
    const handleBookingDelete = ({ id }) => {
        // Simple: solo recargamos la data
        fetchBookings(currentPage, filters);
    };

    socket.on('booking_update', handleBookingUpdate);
    socket.on('booking_deleted', handleBookingDelete);

    return () => {
      socket.off('booking_update', handleBookingUpdate);
      socket.off('booking_deleted', handleBookingDelete);
      socket.disconnect();
    };
  }, [currentPage, filters, fetchBookings, qrData.bookingId, qrData.status]);
  
  // Manejador de Filtros (ahora resetea la página a 1)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Volver a la página 1 al cambiar filtros
  };

  // Reseteador de Filtros (actualizado)
  const clearFilters = () => {
    setFilters({ 
      name: '', 
      court: 'all', 
      payment: 'all', 
      date: '' // Limpiamos la fecha también
    });
    setCurrentPage(1);
  };
  // ---------------------------------
  
  // --- PAGINACIÓN ---
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
  // ------------------


  // --- (Funciones de Modales y Pago sin cambios) ---
  const handleOpenModal = (booking = null) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };
  const handleSuccess = () => {
    fetchBookings(currentPage, filters); // Recargamos la página actual
    handleCloseModal();
  };
  const handleUpdateStatus = async (id, status, isPaid, paymentMethod) => {
    try {
        await bookingService.updateBookingStatus(id, { status, isPaid, paymentMethod });
        // El socket se encargará de actualizar la UI
    } catch (err) {
        alert('Error al actualizar la reserva.');
    }
  };
  const handleCancel = async (id) => {
      if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
          try {
              await bookingService.cancelBooking(id);
              // El socket se encargará de actualizar la UI
          } catch (err) {
              alert('Error al cancelar la reserva.');
          }
      }
  };
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
          payer: { name: booking.user.name, email: booking.user.email || "test_user@test.com" }, // Usamos el email guardado
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
  const cleanPhoneNumber = (number) => {
    return (number || '').replace(/[^0-9]/g, ''); 
  };
  // ----------------------------------------------------

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

      {/* --- BARRA DE FILTROS --- */}
      <div className="mb-6 p-4 bg-dark-secondary rounded-lg shadow-md flex flex-wrap items-end gap-4">
        <FunnelIcon className="h-6 w-6 text-primary flex-shrink-0" />
        
        <div className="flex-grow min-w-[200px]">
          <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Nombre Cliente</label>
          <input
            type="text"
            name="name"
            id="name"
            placeholder="Buscar por nombre..."
            value={filters.name}
            onChange={handleFilterChange}
            className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
          />
        </div>
        
        <div className="flex-grow min-w-[150px]">
          <label htmlFor="date" className="block text-sm font-medium text-text-secondary">Fecha</label>
          <input
            type="date"
            name="date"
            id="date"
            value={filters.date}
            onChange={handleFilterChange}
            className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
          />
        </div>

        <div className="flex-grow min-w-[150px]">
          <label htmlFor="court" className="block text-sm font-medium text-text-secondary">Cancha</label>
          <select
            name="court"
            id="court"
            value={filters.court}
            onChange={handleFilterChange}
            className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
          >
            <option value="all">Todas las canchas</option>
            {courts.map(court => (
              <option key={court._id} value={court._id}>{court.name}</option>
            ))}
          </select>
        </div>

        <div className="flex-grow min-w-[150px]">
          <label htmlFor="payment" className="block text-sm font-medium text-text-secondary">Pago</label>
          <select
            name="payment"
            id="payment"
            value={filters.payment}
            onChange={handleFilterChange}
            className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
          >
            <option value="all">Todos</option>
            <option value="paid">Pagados</option>
            <option value="pending">Pendientes</option>
          </select>
        </div>

        <button
          onClick={clearFilters}
          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white flex-shrink-0"
          title="Limpiar filtros"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* --- TABLA DE RESERVAS --- */}
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

      {/* --- PAGINACIÓN --- */}
      <div className="flex justify-between items-center bg-dark-secondary px-6 py-3 rounded-b-lg border-t border-gray-700">
        <span className="text-sm text-text-secondary">
          Total de reservas: {totalBookings}
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
