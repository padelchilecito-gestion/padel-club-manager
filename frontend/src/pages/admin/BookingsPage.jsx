// frontend/src/pages/admin/BookingsPage.jsx
// --- CÓDIGO COMPLETO Y CORREGIDO ---

import React, { useState, useEffect } from 'react';
// 1. CORRECCIÓN EN LA IMPORTACIÓN:
import bookingService from '../../services/bookingService';
import { getCourts } from '../../services/courtService';
import { userService } from '../../services/userService';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { FullPageLoading, ErrorMessage } from '../../components/ui/Feedback';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import toast from 'react-hot-toast';
import PaymentQRModal from '../../components/admin/PaymentQRModal';

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [users, setUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // 2. CORRECCIÓN EN LA LLAMADA (se añade bookingService.):
      const data = await bookingService.getBookings(); 
      
      // Mapeo de canchas
      const courtsData = await getCourts();
      setCourts(courtsData);
      
      // Mapeo de usuarios
      const usersData = await userService.getUsers();
      const usersMap = usersData.reduce((acc, user) => {
        acc[user._id] = user.name;
        return acc;
      }, {});
      setUsers(usersMap);

      const mappedBookings = data.map(booking => ({
        ...booking,
        courtName: courtsData.find(c => c._id === booking.court)?.name || 'Cancha eliminada',
        userName: booking.user ? (usersMap[booking.user] || 'Usuario eliminado') : (booking.clientName || 'Cliente (Público)')
      }));

      setBookings(mappedBookings);
      setError(null);
    } catch (err) {
      console.error("Error fetching bookings:", err);
      setError(err.message || 'Error al cargar las reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openDeleteModal = (booking) => {
    setSelectedBooking(booking);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedBooking(null);
    setIsDeleteModalOpen(false);
  };

  const handleDelete = async () => {
    if (!selectedBooking) return;
    try {
      // 3. CORRECCIÓN EN LA LLAMADA (se añade bookingService.):
      await bookingService.deleteBooking(selectedBooking._id);
      toast.success('Reserva eliminada correctamente');
      closeDeleteModal();
      fetchBookings(); // Recargar la lista
    } catch (err) {
      toast.error('Error al eliminar la reserva');
      console.error("Error deleting booking:", err);
    }
  };

  const openQrModal = (booking) => {
    if (booking.status === 'Confirmed' || booking.paymentStatus === 'Paid') {
      toast.success('Esta reserva ya está pagada.');
      return;
    }
    setSelectedBooking(booking);
    setIsQrModalOpen(true);
  };

  // Esta función se llamará cuando el modal QR confirme el pago
  const handlePaymentSuccess = () => {
    toast.success('Pago registrado. Actualizando reserva...');
    setIsQrModalOpen(false);
    // Podríamos actualizar el estado localmente o recargar todo
    fetchBookings(); 
  };


  if (loading) return <FullPageLoading text="Cargando reservas..." />;
  if (error) return <ErrorMessage message={error} />;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-white">Gestión de Reservas</h1>
        {/* <button className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Nueva Reserva
        </button> */}
      </div>

      {/* Aquí irían filtros de fecha, cancha, etc. */}
      
      <div className="bg-gray-800 shadow-xl rounded-lg overflow-x-auto border border-gray-700">
        <table className="min-w-full text-sm text-left text-gray-300">
          <thead className="text-xs text-gray-400 uppercase bg-gray-900">
            <tr>
              <th scope="col" className="px-6 py-3">Fecha y Hora</th>
              <th scope="col" className="px-6 py-3">Cancha</th>
              <th scope="col" className="px-6 py-3">Cliente</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3">Pago</th>
              <th scope="col" className="px-6 py-3">Precio</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <tr key={booking._id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700">
                  <td className="px-6 py-4 font-medium whitespace-nowrap">
                    {format(parseISO(booking.startTime), "EEE dd MMM - HH:mm 'hs'", { locale: es })}
                  </td>
                  <td className="px-6 py-4">{booking.courtName}</td>
                  <td className="px-6 py-4">{booking.userName || booking.clientName}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      booking.status === 'Confirmed' ? 'bg-green-900 text-green-300' :
                      booking.status === 'Pending' ? 'bg-yellow-900 text-yellow-300' :
                      booking.status === 'Cancelled' ? 'bg-red-900 text-red-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center text-xs ${
                      booking.paymentStatus === 'Paid' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {booking.paymentStatus === 'Paid' ? <CheckCircleIcon className="h-4 w-4 mr-1" /> : <XCircleIcon className="h-4 w-4 mr-1" />}
                      {booking.paymentStatus} ({booking.paymentMethod})
                    </span>
                  </td>
                   <td className="px-6 py-4">${booking.price}</td>
                  <td className="px-6 py-4 flex items-center space-x-3">
                    {booking.paymentStatus !== 'Paid' && (
                       <button 
                        onClick={() => openQrModal(booking)}
                        className="p-1 text-green-400 hover:text-green-300" 
                        title="Registrar Pago (QR/Efectivo)"
                      >
                        <CurrencyDollarIcon className="h-5 w-5" />
                      </button>
                    )}
                    {/* <button className="p-1 text-blue-400 hover:text-blue-300" title="Editar">
                      <PencilIcon className="h-5 w-5" />
                    </button> */}
                    <button 
                      onClick={() => openDeleteModal(booking)}
                      className="p-1 text-red-500 hover:text-red-400" 
                      title="Eliminar"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-8 text-gray-400">
                  No se encontraron reservas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          onConfirm={handleDelete}
          title="Confirmar Eliminación"
          message={`¿Estás seguro de que deseas eliminar la reserva de ${selectedBooking?.userName || selectedBooking?.clientName} el ${selectedBooking ? format(parseISO(selectedBooking.startTime), "dd/MM/yy 'a las' HH:mm", { locale: es }) : ''}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmColor="red"
        />
      )}
      
      {isQrModalOpen && selectedBooking && (
         <PaymentQRModal
            isOpen={isQrModalOpen}
            onClose={() => setIsQrModalOpen(false)}
            booking={selectedBooking}
            onPaymentSuccess={handlePaymentSuccess}
         />
      )}
    </div>
  );
};

export default BookingsPage;
