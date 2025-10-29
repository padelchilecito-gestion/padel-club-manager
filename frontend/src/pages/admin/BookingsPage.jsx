// frontend/src/pages/admin/BookingsPage.jsx - CON BOTÓN DE PAGO MP
import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { courtService } from '../../services/courtService';
import { userService } from '../../services/userService';
import BookingModal from '../../components/BookingModal';
import PaymentQRModal from '../../components/admin/PaymentQRModal'; // Para el QR
import { paymentService } from '../../services/paymentService'; // Para el Link MP
import { toast } from 'react-hot-toast';
import { format, startOfDay, endOfDay, addDays } from 'date-fns'; // Quitamos subDays si no se usa
import { es } from 'date-fns/locale';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, QrCodeIcon, CreditCardIcon } from '@heroicons/react/24/solid';
import { InlineLoading, ErrorMessage } from '../../components/ui/Feedback';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false); // Para el QR
  const [loadingPaymentLink, setLoadingPaymentLink] = useState(null); // Para el Link MP (guarda el ID del booking)

  const fetchBookings = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const start = startOfDay(date);
      const end = endOfDay(date);
      // Asegurarse de que el servicio maneje bien las fechas ISO
      const data = await bookingService.getBookings({
        startDate: start.toISOString(),
        endDate: end.toISOString()
      });
      setBookings(data);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError('No se pudieron cargar las reservas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      // Usar Promise.all para cargar en paralelo si es posible
      const [courtsData, usersData] = await Promise.all([
        courtService.getCourts(),
        userService.getUsers() // Obtener usuarios para el modal
      ]);
      setCourts(courtsData);
      setUsers(usersData);
    } catch (err) {
      console.error("Error fetching initial data:", err);
      setError('Error al cargar datos iniciales (canchas/usuarios).');
    }
  };

  useEffect(() => {
    fetchInitialData();
    // No necesitamos llamar a fetchBookings aquí, se llama abajo
  }, []); // Cargar datos iniciales solo una vez

  useEffect(() => {
    fetchBookings(selectedDate); // Cargar reservas cuando cambie la fecha
  }, [selectedDate]);

  const handleDateChange = (days) => {
    setSelectedDate(prevDate => startOfDay(addDays(prevDate, days)));
  };

  const handleSaveBooking = () => {
    setShowBookingModal(false);
    setSelectedBooking(null);
    fetchBookings(selectedDate); // Recargar
  };

  const handleEditBooking = (booking) => {
    setSelectedBooking(booking);
    setShowBookingModal(true);
  };

  const handleDeleteBooking = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta reserva?')) {
      try {
        await bookingService.deleteBooking(id);
        toast.success('Reserva eliminada');
        fetchBookings(selectedDate); // Recargar
      } catch (err) {
        toast.error('Error al eliminar la reserva');
        console.error("Error deleting booking:", err);
      }
    }
  };

  const handleShowPaymentModal = (booking) => {
    setSelectedBooking(booking);
    setShowPaymentModal(true);
  };

  const handleClosePaymentModal = (paymentSuccess) => {
    setShowPaymentModal(false);
    setSelectedBooking(null);
    if (paymentSuccess) {
      fetchBookings(selectedDate); // Recargar si el pago fue exitoso
    }
  };

  // --- FUNCIÓN PARA PAGAR CON LINK MP ---
  const handlePayWithMP = async (bookingId) => {
    setLoadingPaymentLink(bookingId); // Indicar que se está cargando para este booking
    try {
      // Usar la función generatePaymentLink (la del botón web original)
      const data = await paymentService.generatePaymentLink(bookingId);
      if (data.init_point) {
        window.open(data.init_point, '_blank'); // Abrir link en nueva pestaña
      } else {
        throw new Error('No se recibió el link de pago (init_point)');
      }
    } catch (err) {
      console.error("Error generating MP Link:", err);
      toast.error(err.message || 'No se pudo generar el link de Mercado Pago');
    } finally {
      setLoadingPaymentLink(null); // Quitar indicador de carga
    }
  };
  // ------------------------------------------

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-6 text-cyan-400">Gestión de Reservas</h1>

      {/* Selector de Fecha */}
      <div className="mb-6 flex flex-wrap justify-between items-center bg-gray-800 p-4 rounded-lg shadow-md gap-4"> {/* Added flex-wrap y gap */}
        <div className="flex items-center"> {/* Agrupado controles de fecha */}
          <button onClick={() => handleDateChange(-1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <h2 className="text-xl font-semibold capitalize mx-4 whitespace-nowrap"> {/* Added whitespace-nowrap */}
            {format(selectedDate, 'EEEE dd \'de\' MMMM \'de\' yyyy', { locale: es })}
          </h2>
          <button onClick={() => handleDateChange(1)} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>
        <button
          onClick={() => { setSelectedBooking(null); setShowBookingModal(true); }}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-all"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Reserva
        </button>
      </div>

      {loading && <InlineLoading text="Cargando reservas..." />}
      {error && !loading && <ErrorMessage message={error} />}

      {!loading && !error && (
        <div className="bg-gray-800 shadow-xl rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full table-auto">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cancha</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-gray-800 divide-y divide-gray-700">
                {bookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400">
                      No hay reservas para esta fecha.
                    </td>
                  </tr>
                ) : (
                  bookings.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)) // Ordenar por hora
                  .map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                        {format(new Date(booking.startTime), 'HH:mm')} - {format(new Date(booking.endTime), 'HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{booking.court?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{booking.user?.name || 'N/A'} {booking.user?.lastName || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${booking.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          booking.isPaid ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'
                        }`}>
                          {booking.isPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                         {/* Mostramos el método si está pagado */}
                         {booking.isPaid && booking.paymentMethod && (
                           <span className="text-xs text-gray-400 ml-2">({booking.paymentMethod})</span>
                         )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2 flex items-center"> {/* Added flex items-center */}
                        {!booking.isPaid && (
                          <>
                            {/* BOTÓN MOSTRAR QR */}
                            <button
                              onClick={() => handleShowPaymentModal(booking)}
                              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-3 rounded-lg text-xs inline-flex items-center transition-colors flex-shrink-0" /* Added flex-shrink-0 */
                              title="Mostrar QR para pagar"
                            >
                              <QrCodeIcon className="h-4 w-4 mr-1"/> QR
                            </button>
                            {/* NUEVO BOTÓN PAGAR CON MP (LINK) */}
                            <button
                              onClick={() => handlePayWithMP(booking._id)}
                              disabled={loadingPaymentLink === booking._id} // Deshabilitar mientras carga este link
                              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded-lg text-xs inline-flex items-center transition-colors disabled:opacity-50 flex-shrink-0" /* Added flex-shrink-0 */
                              title="Generar y abrir link de Mercado Pago"
                            >
                              <CreditCardIcon className="h-4 w-4 mr-1"/>
                              {loadingPaymentLink === booking._id ? 'Generando...' : 'Pagar MP'}
                            </button>
                          </>
                        )}
                        <button onClick={() => handleEditBooking(booking)} className="text-cyan-400 hover:text-cyan-300 flex-shrink-0" title="Editar">Editar</button> {/* Added flex-shrink-0 */}
                        <button onClick={() => handleDeleteBooking(booking._id)} className="text-red-500 hover:text-red-400 flex-shrink-0" title="Eliminar">Eliminar</button> {/* Added flex-shrink-0 */}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showBookingModal && (
        <BookingModal
          booking={selectedBooking}
          courts={courts}
          users={users} // Pasar usuarios al modal
          onClose={() => { setShowBookingModal(false); setSelectedBooking(null); }}
          onSave={handleSaveBooking}
          selectedDate={selectedDate} // Pasar fecha seleccionada para pre-rellenar
        />
      )}

      {showPaymentModal && selectedBooking && (
        <PaymentQRModal // El modal de QR ahora solo muestra QR
          booking={selectedBooking}
          onClose={handleClosePaymentModal}
        />
      )}
    </div>
  );
};

export default BookingsPage;
