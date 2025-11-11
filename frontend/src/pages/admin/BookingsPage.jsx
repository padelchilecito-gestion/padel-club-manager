import React, { useState, useEffect, useMemo } from 'react';
import { bookingService } from '../../services/bookingService';
import { courtService } from '../../services/courtService'; // Importamos CourtService
import { paymentService } from '../../services/paymentService'; 
import socket from '../../services/socketService';
import { format, startOfDay, isSameDay } from 'date-fns'; // Importamos helpers de date-fns
import { utcToZonedTime } from 'date-fns-tz';
import { PencilIcon, XCircleIcon, CurrencyDollarIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/solid'; 
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
  const [bookings, setBookings] = useState([]); // Lista original de la API
  const [courts, setCourts] = useState([]); // Lista de canchas para el filtro
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // --- ESTADOS PARA LOS FILTROS (CON EL NUEVO FILTRO DE NOMBRE) ---
  const [filters, setFilters] = useState({
    name: '', // <-- TU NUEVO FILTRO
    court: 'all',
    payment: 'all',
    date: '' 
  });
  // -----------------------------------

  const [qrData, setQrData] = useState({
    qrValue: '',
    total: 0,
    status: 'idle',
    bookingId: null 
  });

  const timeZone = 'America/Argentina/Buenos_Aires';

  // Función para cargar canchas y turnos
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      setError('');
      try {
        const [bookingsData, courtsData] = await Promise.all([
          bookingService.getAllBookings(),
          courtService.getAllCourts() // <-- Cargamos las canchas para el selector
        ]);
        setBookings(bookingsData);
        setCourts(courtsData);
      } catch (err) {
        setError('No se pudieron cargar los datos.');
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, []); 

  // (Efecto de Socket.IO sin cambios)
  useEffect(() => {
    socket.connect();

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
        
        if (
            qrData.bookingId === updatedBooking._id && 
            updatedBooking.isPaid &&
            qrData.status === 'pending'
        ) {
            setQrData(prev => ({ ...prev, status: 'successful' }));
        }
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
  }, [qrData.bookingId, qrData.status]);

  // --- LÓGICA DE FILTRADO (CON EL NUEVO FILTRO DE NOMBRE) ---
  const filteredBookings = useMemo(() => {
    let filtered = [...bookings];

    // --- 1. Filtro por Nombre (NUEVO) ---
    if (filters.name) {
      filtered = filtered.filter(b => 
        b.user.name.toLowerCase().includes(filters.name.toLowerCase())
      );
    }

    // --- 2. Filtro por Cancha ---
    if (filters.court !== 'all') {
      filtered = filtered.filter(b => b.court?._id === filters.court);
    }

    // --- 3. Filtro por Pago ---
    if (filters.payment !== 'all') {
      const isPaidFilter = filters.payment === 'paid';
      filtered = filtered.filter(b => b.isPaid === isPaidFilter);
    }

    // --- 4. Filtro por Fecha ---
    if (filters.date) {
      const filterDateStart = startOfDay(new Date(filters.date + 'T00:00:00'));
      filtered = filtered.filter(b => {
        const bookingDate = startOfDay(utcToZonedTime(new Date(b.startTime), timeZone));
        // Usamos isSameDay para comparar fechas ignorando la hora
        return isSameDay(bookingDate, filterDateStart);
      });
    }

    return filtered;
  }, [bookings, filters]);
  
  // Manejador de Filtros (sin cambios)
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Reseteador de Filtros (actualizado)
  const clearFilters = () => {
    setFilters({ name: '', court: 'all', payment: 'all', date: '' });
  };
  // ---------------------------------

  // --- (Funciones de Modales y Pago sin cambios, incluyendo la corrección del bug) ---
  const handleOpenModal = (booking = null) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
  };
  const handleSuccess = () => {
    fetchBookings(); // Recargamos todo al crear/editar
    handleCloseModal();
  };
  const handleUpdateStatus = async (id, status, isPaid, paymentMethod) => {
    try {
        const updatedBooking = await bookingService.updateBookingStatus(id, { status, isPaid, paymentMethod });
        setBookings(prevBookings => 
          prevBookings.map(b => 
            b._id === updatedBooking._id ? updatedBooking : b
          )
        );
    } catch (err) {
        alert('Error al actualizar la reserva.');
    }
  };
  const handleCancel = async (id) => {
      if (window.confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
          try {
              await bookingService.cancelBooking(id);
              // El socket actualizará la UI
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
  const cleanPhoneNumber = (number) => {
    return (number || '').replace(/[^0-9]/g, ''); 
  };
  // ----------------------------------------------------

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

      {/* --- BARRA DE FILTROS (CON EL NUEVO FILTRO DE NOMBRE) --- */}
      <div className="mb-6 p-4 bg-dark-secondary rounded-lg shadow-md flex flex-wrap items-end gap-4">
        <FunnelIcon className="h-6 w-6 text-primary flex-shrink-0" />
        
        {/* --- Filtro por Nombre (NUEVO) --- */}
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
        
        {/* Filtro por Fecha */}
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

        {/* Filtro por Cancha */}
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

        {/* Filtro por Pago */}
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

        {/* Botón de Limpiar */}
        <button
          onClick={clearFilters}
          className="p-2 bg-gray-600 hover:bg-gray-500 rounded-md text-white flex-shrink-0"
          title="Limpiar filtros"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
      {/* --- FIN DE LA BARRA DE FILTROS --- */}

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
            {/* Usamos 'filteredBookings' en lugar de 'bookings' */}
            {filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
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
