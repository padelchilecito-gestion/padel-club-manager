// frontend/src/services/bookingService.js - CORREGIDO (VERSIÓN FINAL)
import api from './api';
import { format } from 'date-fns'; // Necesario para formatear fechas si se usa

// Obtener reservas (con filtros opcionales)
const getBookings = async (filters = {}) => {
  try {
    // Convertir fechas a ISO string si existen
    if (filters.startDate) filters.startDate = new Date(filters.startDate).toISOString();
    if (filters.endDate) filters.endDate = new Date(filters.endDate).toISOString();

    const { data } = await api.get('/bookings', { params: filters });
    return data;
  } catch (error) {
    console.error('Error fetching bookings:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al obtener las reservas');
  }
};

// Obtener una reserva por ID
const getBookingById = async (id) => {
  try {
    const { data } = await api.get(`/bookings/${id}`);
    return data;
  } catch (error) {
    console.error(`Error fetching booking ${id}:`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al obtener la reserva');
  }
};

// Crear una nueva reserva
const createBooking = async (bookingData) => {
  try {
    const { data } = await api.post('/bookings', bookingData);
    return data;
  } catch (error) {
    console.error('Error creating booking:', error.response?.data);
    // Extraer mensajes de validación si existen
    if (error.response?.data?.errors) {
      const messages = error.response.data.errors.map(err => err.msg).join(', ');
      throw new Error(messages || 'Error al crear la reserva');
    }
    throw new Error(error.response?.data?.message || 'Error al crear la reserva');
  }
};

// Actualizar una reserva
const updateBooking = async (id, bookingData) => {
  try {
    const { data } = await api.put(`/bookings/${id}`, bookingData);
    return data;
  } catch (error) {
    console.error(`Error updating booking ${id}:`, error.response?.data);
     if (error.response?.data?.errors) {
       const messages = error.response.data.errors.map(err => err.msg).join(', ');
       throw new Error(messages || 'Error al actualizar la reserva');
     }
    throw new Error(error.response?.data?.message || 'Error al actualizar la reserva');
  }
};

// Eliminar una reserva
const deleteBooking = async (id) => {
  try {
    const { data } = await api.delete(`/bookings/${id}`);
    return data;
  } catch (error) {
    console.error(`Error deleting booking ${id}:`, error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al eliminar la reserva');
  }
};

// Verificar disponibilidad para una cancha y fecha
const checkAvailability = async (courtId, date) => {
  try {
    // Asegurar que la fecha se envíe en formato ISO (YYYY-MM-DDTHH:mm:ss.sssZ) o YYYY-MM-DD
    // El backend espera ISO o YYYY-MM-DD según la ruta. Verifiquemos /availability/:courtId
    // La ruta espera 'YYYY-MM-DD' como query param 'date'.
    const dateString = format(new Date(date), 'yyyy-MM-dd');
    const { data } = await api.get(`/bookings/availability/${courtId}?date=${dateString}`);
    return data;
  } catch (error) {
    console.error('Error checking availability:', error.response?.data);
    throw new Error(error.response?.data?.message || 'Error al verificar disponibilidad');
  }
};


// --- LA PARTE MÁS IMPORTANTE ---
// Exportar un objeto que contenga TODAS las funciones definidas arriba
export const bookingService = {
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  checkAvailability // <-- ¡ASEGÚRATE DE QUE ESTÉ AQUÍ!
};
// --- ---
