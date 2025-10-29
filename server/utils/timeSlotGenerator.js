// server/utils/timeSlotGenerator.js
const { addMinutes, format, parse } = require('date-fns');

/**
 * Genera una lista de strings de tiempo (HH:MM) para los slots de un día.
 * Puede manejar horarios que cruzan la medianoche (ej. de 22:00 a 02:00).
 *
 * @param {string} openTimeString - Hora de apertura en formato "HH:MM".
 * @param {string} closeTimeString - Hora de cierre en formato "HH:MM".
 * @param {number} slotDurationMinutes - Duración de cada slot en minutos.
 * @returns {string[]} Un array de strings "HH:MM" representando el inicio de cada slot.
 */
const generateTimeSlots = (openTimeString, closeTimeString, slotDurationMinutes) => {
    const slots = [];
    
    // Parsear las horas usando una fecha base para que date-fns pueda comparar
    // Usamos una fecha ficticia (ej. 2023-01-01) y ajustamos el día si el cierre es "al día siguiente"
    let startTime = parse(openTimeString, 'HH:mm', new Date(2023, 0, 1)); // 2023-01-01 HH:MM
    let endTime = parse(closeTimeString, 'HH:mm', new Date(2023, 0, 1)); // 2023-01-01 HH:MM

    // Si la hora de cierre es menor que la de apertura, significa que el horario cruza la medianoche.
    // Ajustamos el endTime para que sea al día siguiente.
    if (endTime <= startTime) {
        endTime = addDays(endTime, 1);
    }

    let currentTime = startTime;
    while (currentTime < endTime) {
        slots.push(format(currentTime, 'HH:mm'));
        currentTime = addMinutes(currentTime, slotDurationMinutes);
    }

    return slots;
};

module.exports = { generateTimeSlots };
