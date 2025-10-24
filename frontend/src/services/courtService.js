import api from './api';

// --- FUNCIONES PÚBLICAS (LAS QUE FALTABAN) ---

/**
 * Obtiene solo las canchas activas para el público.
 */
export const getPublicCourts = async () => {
  const { data } = await api.get('/courts/public');
  return data;
};

/**
 * Obtiene la disponibilidad para una cancha y fecha específicas.
 * (En el backend se llama 'getAvailabilityForPublic')
 */
export const getAvailability = async (date, courtId) => {
  // --- CORRECCIÓN AQUÍ ---
  // Faltaba desestructurar { data } para retornar solo el array,
  // igual que hace getPublicCourts.
  const { data } = await api.get(`/courts/availability/${date}/${courtId}`);
  return data;
  // --- FIN DE CORRECCIÓN ---
};

// --- FUNCIONES DE ADMIN (LAS QUE YA ESTABAN) ---

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
