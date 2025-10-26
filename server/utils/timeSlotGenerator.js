const { addMinutes, format, parse } = require('date-fns');

const generateTimeSlots = (startTime, endTime, duration) => {
  const slots = [];
  const baseDate = '1970-01-01';
  
  let currentTime = parse(`${baseDate}T${startTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
  let lastTime = parse(`${baseDate}T${endTime}`, "yyyy-MM-dd'T'HH:mm", new Date());

  // Si endTime es menor que startTime, significa que cruzamos medianoche
  if (lastTime <= currentTime) {
    lastTime = parse(`1970-01-02T${endTime}`, "yyyy-MM-dd'T'HH:mm", new Date());
  }

  while (currentTime < lastTime) {
    slots.push(format(currentTime, 'HH:mm'));
    currentTime = addMinutes(currentTime, duration);
  }
  
  return slots;
};

module.exports = { generateTimeSlots };