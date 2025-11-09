import React, { useState } from 'react';

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));

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

const ScheduleEditor = ({ schedule, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isSetting, setIsSetting] = useState(false); // true si estamos "pintando", false si "borrando"

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

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-gray-700" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      {/* --- CORRECCIÓN DE ESTILO ---
        Se eliminó 'min-w-full' y se cambió 'border-collapse' por 'border-spacing-0'
        para asegurar que el overflow-x-auto funcione correctamente.
      */}
      <table className="border-spacing-0 border-gray-700 table-fixed">
        <thead className="bg-dark-primary">
          <tr>
            <th className="w-24 border-r border-b border-gray-700 p-2 text-xs sticky left-0 z-10 bg-dark-primary">Día</th>
            {hours.map(hour => (
              <th key={hour} colSpan={2} className="w-16 border-r border-b border-gray-700 p-2 text-xs font-normal text-text-secondary">
                {hour}:00
              </th>
            ))}
            <th className="w-32 border-l border-b border-gray-700 p-2 text-xs sticky right-0 z-10 bg-dark-primary">Acciones</th>
          </tr>
        </thead>
        <tbody className="select-none">
          {days.map((day, dayIndex) => (
            <tr key={dayIndex} className="border-t border-gray-700">
              {/* --- ESTILO MEJORADO ---
                Añadimos 'sticky left-0' para fijar el día al hacer scroll horizontal
              */}
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

               {/* --- ESTILO MEJORADO ---
                Añadimos 'sticky right-0' para fijar las acciones al hacer scroll
              */}
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

export default ScheduleEditor;
