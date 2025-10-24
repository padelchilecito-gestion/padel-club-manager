import api from './api';

// --- NUEVA FUNCIÓN (Punto 1) ---
/**
 * Obtiene la disponibilidad agregada para una FECHA (en todas las canchas).
 */
export const getAggregatedAvailability = async (date) => {
  // Llama a la nueva ruta: GET /api/courts/availability/:date
  const { data } = await api.get(`/courts/availability/${date}`);
  return data;
};


// --- FUNCIONES ANTIGUAS (Mantenidas por si el Admin las usa) ---

/**
 * Obtiene solo las canchas activas para el público.
 */
export const getPublicCourts = async () => {
  const { data } = await api.get('/courts/public');
  return data;
};

/**
 * (Obsoleto para el flujo público) Obtiene la disponibilidad para una cancha y fecha específicas.
 */
export const getAvailability = async (date, courtId) => {
  const { data } = await api.get(`/courts/availability/${date}/${courtId}`);
  return data;
};

// --- FUNCIONES DE ADMIN ---

/**
 * (Admin) Obtiene todas las canchas.
 */
export const getCourts = async () => {
  const { data } = await api.get('/courts');
  return data;
};

/**
 * (Admin) Crea una nueva cancha.
 */
export const createCourt = async (courtData) => {
  const { data } = await api.post('/courts', courtData);
  return data;
};

/**
 * (Admin) Actualiza una cancha.
 */
export const updateCourt = async (id, courtData) => {
  const { data } = await api.put(`/courts/${id}`, courtData);
  return data;
};

/**
 * (Admin) Elimina una cancha.
 */
export const deleteCourt = async (id) => {
  const { data } = await api.delete(`/courts/${id}`);
  return data;
};
