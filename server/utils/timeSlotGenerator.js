const { addMinutes, format, parse } = require('date-fns');

/**
 * Genera una lista de strings de tiempo (ej: "HH:mm")
 * @param {string} startTime - Ej: "09:00"
 * @param {string} endTime - Ej: "23:00"
 * @param {number} duration - Duración del slot en minutos (ej: 30)
 * @returns {string[]} - Array de strings de tiempo
 */
const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  // Usamos una fecha base solo para los cálculos
  const baseDate = '1970-01-01'; 
  
  let currentTime = parse(`${baseDate}T${startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
  const lastTime = parse(`${baseDate}T${endTime}`, "yyyy-MM-dd'T'HH:mm", new Date());

  // Itera mientras la hora actual sea menor que la hora de cierre
  while (currentTime < lastTime) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, duration);
  }
  
  return slots;
};

module.exports = { generateTimeSlots };
