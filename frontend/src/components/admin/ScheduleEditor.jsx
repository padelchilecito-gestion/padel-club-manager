import React, { useState } from 'react';

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
const timeOptions = Array.from({ length: 49 }, (_, i) => { // 49 para incluir 24:00
  const totalMinutes = i * 30;
  const h = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}); // Genera ["00:00", "00:30", ..., "23:30", "24:00"]


// --- VISTA PARA MÓVIL ---
// Se muestra en pantallas pequeñas (debajo de 'lg')
const MobileScheduleEditor = ({ schedule, onChange }) => {
  
  const timeToIndex = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 2 + (m / 30);
  };
  
  const indexToTime = (index) => {
    return timeOptions[index];
  };

  // Esta función convierte la grilla [true, false, true] en rangos ["00:00-00:30", "01:00-01:30"]
  const getRangesForDay = (dayIndex) => {
    const daySchedule = schedule[dayIndex];
    if (!daySchedule) return [];
    
    let ranges = [];
    let start = -1;
    
    for (let i = 0; i < 48; i++) {
      if (daySchedule[i] && start === -1) {
        start = i;
      } else if (!daySchedule[i] && start !== -1) {
        ranges.push({ start: indexToTime(start), end: indexToTime(i) });
        start = -1;
      }
    }
    // Si termina en "true"
    if (start !== -1) {
      ranges.push({ start: indexToTime(start), end: "24:00" });
    }
    return ranges;
  };

  // Esta es la lógica inversa, toma rangos y actualiza la grilla
  const updateDayScheduleFromRanges = (dayIndex, ranges) => {
    const newDaySchedule = Array(48).fill(false);
    ranges.forEach(range => {
      let startIndex = timeToIndex(range.start);
      let endIndex = timeToIndex(range.end);
      // Permitimos que el final sea 24:00 (índice 48)
      if (endIndex > 48) endIndex = 48;

      for (let i = startIndex; i < endIndex; i++) {
        if (i < 48) { // Aseguramos no salirnos del array
          newDaySchedule[i] = true;
        }
      }
    });

    const newSchedule = { ...schedule, [dayIndex]: newDaySchedule };
    onChange(newSchedule);
  };

  const handleAddRange = (dayIndex) => {
    const ranges = getRangesForDay(dayIndex);
    // Añade un rango por defecto de 9am a 5pm
    const newRanges = [...ranges, { start: '09:00', end: '17:00' }];
    updateDayScheduleFromRanges(dayIndex, newRanges);
  };

  const handleRemoveRange = (dayIndex, rangeIndex) => {
    let ranges = getRangesForDay(dayIndex);
    ranges.splice(rangeIndex, 1);
    updateDayScheduleFromRanges(dayIndex, ranges);
  };

  const handleRangeChange = (dayIndex, rangeIndex, part, value) => {
    let ranges = getRangesForDay(dayIndex);
    ranges[rangeIndex][part] = value;
    
    // Validar que fin > inicio
    const { start, end } = ranges[rangeIndex];
    if (timeToIndex(end) <= timeToIndex(start)) {
        if (part === 'start') {
            // Si el inicio es >= fin, ajusta el fin
            ranges[rangeIndex].end = timeOptions[timeToIndex(start) + 1] || "24:00";
        } else {
             // Si el fin es <= inicio, ajusta el inicio
             ranges[rangeIndex].start = timeOptions[timeToIndex(end) - 1] || "00:00";
        }
    }
    
    updateDayScheduleFromRanges(dayIndex, ranges);
  };

  // Componente <select> para las horas
  const TimeSelect = ({ value, onChange }) => (
    <select 
      value={value} 
      onChange={onChange} 
      className="w-full bg-dark-primary border border-gray-600 rounded-md p-2 text-text-primary focus:ring-primary focus:border-primary"
    >
      {timeOptions.map(time => <option key={time} value={time}>{time}</option>)}
    </select>
  );

  return (
    <div className="space-y-4">
      {days.map((day, dayIndex) => (
        <div key={day} className="border border-gray-700 rounded-lg p-3">
          <h4 className="text-lg font-semibold text-text-primary mb-2">{day}</h4>
          <div className="space-y-2">
            {getRangesForDay(dayIndex).map((range, rangeIndex) => (
              <div key={rangeIndex} className="flex items-center gap-2">
                <TimeSelect
                  value={range.start}
                  onChange={(e) => handleRangeChange(dayIndex, rangeIndex, 'start', e.target.value)}
                />
                <span className="text-text-secondary">a</span>
                <TimeSelect
                  value={range.end}
                  onChange={(e) => handleRangeChange(dayIndex, rangeIndex, 'end', e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => handleRemoveRange(dayIndex, rangeIndex)}
                  className="text-danger hover:text-red-400 p-1 flex-shrink-0"
                >
                  &#x2715; {/* X character */}
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={() => handleAddRange(dayIndex)}
              className="text-sm text-secondary hover:text-green-300"
            >
              + Añadir rango
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};


// --- VISTA PARA DESKTOP ---
// Se muestra en pantallas 'lg' y superiores
const DesktopScheduleEditor = ({ schedule, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSetting, setIsSetting] = useState(false); // true si "pintando", false si "borrando"

  const handleMouseDown = (dayIndex, slotIndex) => {
    setIsDragging(true);
    const currentStatus = schedule[dayIndex][slotIndex];
    const newStatus = !currentStatus;
    setIsSetting(newStatus);
    updateSlot(dayIndex, slotIndex, newStatus);
  };

  const handleMouseEnter = (dayIndex, slotIndex) => {
    if (isDragging) {
      updateSlot(dayIndex, slotIndex, isSetting);
    }
  };

  const updateSlot = (dayIndex, slotIndex, newStatus) => {
    const newSchedule = { ...schedule };
    const newDaySchedule = [...newSchedule[dayIndex]];
    
    if (newDaySchedule[slotIndex] !== newStatus) {
        newDaySchedule[slotIndex] = newStatus;
        newSchedule[dayIndex] = newDaySchedule;
        onChange(newSchedule);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSelectAll = (dayIndex) => {
    const newSchedule = { ...schedule };
    newSchedule[dayIndex] = Array(48).fill(true);
    onChange(newSchedule);
  };

  const handleClearAll = (dayIndex) => {
     const newSchedule = { ...schedule };
    newSchedule[dayIndex] = Array(48).fill(false);
    onChange(newSchedule);
  };

  // Componente de celda individual (30 min)
  const TimeSlot = ({ isSet, onToggle }) => (
    <td
      onMouseDown={onToggle}
      onMouseEnter={onToggle}
      className={`h-8 border-b border-r border-gray-700 cursor-pointer ${
        isSet ? 'bg-secondary' : 'bg-dark-primary hover:bg-gray-600'
      }`}
    />
  );

  return (
     <div className="w-full overflow-x-auto rounded-lg border border-gray-700" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <p className="text-sm text-text-secondary p-2 md:hidden">
          ← Desliza para ver todas las horas →
        </p>
        <table className="border-spacing-0 border-gray-700 table-fixed">
          <thead className="bg-dark-primary">
            <tr>
              <th className="w-20 border-r border-b border-gray-700 p-2 text-xs sticky left-0 z-10 bg-dark-primary">Día</th>
              {hours.map(hour => (
                <th key={hour} colSpan={2} className="w-14 border-r border-b border-gray-700 p-1 text-xs font-normal text-text-secondary">
                  {hour}:00
                </th>
              ))}
              <th className="w-28 border-l border-b border-gray-700 p-2 text-xs sticky right-0 z-10 bg-dark-primary">Acciones</th>
            </tr>
          </thead>
          <tbody className="select-none">
            {days.map((day, dayIndex) => (
              <tr key={dayIndex} className="border-t border-gray-700">
                <td className="border-r border-gray-700 p-2 text-center font-semibold text-text-primary sticky left-0 z-10 bg-dark-secondary">
                  {day}
                </td>
                
                {schedule && schedule[dayIndex] && schedule[dayIndex].map((isSet, slotIndex) => (
                  <TimeSlot
                    key={slotIndex}
                    isSet={isSet}
                    onToggle={(e) => {
                      if (e.type === 'mousedown') {
                        handleMouseDown(dayIndex, slotIndex);
                      } else if (e.type === 'mouseenter') {
                        handleMouseEnter(dayIndex, slotIndex);
                      }
                    }}
                  />
                ))}

                 <td className="border-l border-gray-700 p-2 text-center sticky right-0 z-10 bg-dark-secondary">
                   <button type="button" onClick={() => handleSelectAll(dayIndex)} className="text-xs text-secondary hover:text-green-300">Todo</button>
                   <span className="text-gray-600 mx-1">|</span>
                   <button type="button" onClick={() => handleClearAll(dayIndex)} className="text-xs text-danger hover:text-red-400">Nada</button>
                 </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
  );
};


// --- COMPONENTE PRINCIPAL ---
// Este componente decide cuál editor mostrar (Móvil o Desktop)
const ScheduleEditor = ({ schedule, onChange }) => {
  return (
    <>
      {/* --- VISTA DESKTOP: Oculta en pantallas pequeñas ('lg') --- */}
      <div className="hidden lg:block">
        <p className="text-sm text-text-secondary mb-4">
            Selecciona los bloques de 30 minutos en los que el club está abierto. 
            (Click y arrastra para seleccionar/deseleccionar).
        </p>
        <DesktopScheduleEditor schedule={schedule} onChange={onChange} />
      </div>

      {/* --- VISTA MÓVIL: Se muestra solo en pantallas pequeñas (debajo de 'lg') --- */}
      <div className="block lg:hidden">
         <p className="text-sm text-text-secondary mb-4">
            Define los rangos horarios en los que el club está abierto para cada día.
        </p>
        <MobileScheduleEditor schedule={schedule} onChange={onChange} />
      </div>
    </>
  );
};

export default ScheduleEditor;
