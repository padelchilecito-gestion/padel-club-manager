import api from './api';

/**
 * Obtiene la configuración como un objeto key-value.
 */
export const getSettings = async () => {
  const { data } = await api.get('/settings');
  return data;
};

/**
 * Actualiza la configuración.
 * @param {object} settings - Un objeto con las claves y valores a actualizar.
 */
export const updateSettings = async (settings) => {
  const { data } = await api.put('/settings', settings);
  return data;
};
