const { addMinutes, format } = require('date-fns');

/**
 * Genera una lista de horarios (time slots) entre una hora de inicio y una de fin.
 * @param {string} startTime - Hora de inicio (ej. "09:00").
 * @param {string} endTime - Hora de fin (ej. "23:00").
 * @param {number} slotDuration - Duración del turno en minutos.
 * @returns {Array<string>} Una lista de horarios en formato "HH:mm".
 */
function generateTimeSlots(startTime, endTime, slotDuration) {
    const slots = [];
    let currentTime = new Date(`1970-01-01T${startTime}:00`);
    const end = new Date(`1970-01-01T${endTime}:00`);

    while (currentTime < end) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, slotDuration);
    }

    return slots;
}

module.exports = { generateTimeSlots };
