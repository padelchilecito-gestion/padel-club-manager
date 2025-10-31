import React, { useState, useEffect, useMemo, useCallback } from 'react';

// Constantes
const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_NAMES_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// --- Componente de Celda (Memoizado para rendimiento) ---
const ScheduleCell = React.memo(({ isOpen, onMouseDown, onMouseEnter }) => (
  <div
    onMouseDown={onMouseDown}
    onMouseEnter={onMouseEnter}
    className={`h-6 w-full border border-gray-200 cursor-pointer select-none
                ${isOpen ? 'bg-green-500' : 'bg-gray-100 hover:bg-gray-300'}`}
  />
));

// --- Componente Principal de la Grilla ---
const ScheduleGrid = ({ slotDuration = 30, openingHours, onScheduleChange }) => {
  const [grid, setGrid] = useState([]);
  const [isPainting, setIsPainting] = useState(false);
  const [paintMode, setPaintMode] = useState(true); // true = pintar 'abierto', false = pintar 'cerrado'

  const totalSlots = useMemo(() => (24 * 60) / slotDuration, [slotDuration]);

  // --- 1. "De-traductor" (API -> Grilla Visual) ---
  // Convierte los 21 campos de la API en la grilla visual de 7x48
  useEffect(() => {
    const timeToSlotIndex = (time) => {
      if (!time) return -1;
      const [hours, minutes] = time.split(':').map(Number);
      return Math.floor((hours * 60 + minutes) / slotDuration);
    };

    const newGrid = DAYS_OF_WEEK.map(dayKey => {
      const daySlots = Array(totalSlots).fill(false);
      const isOpen = openingHours[`${dayKey}_IS_OPEN`] === 'true';
      
      if (isOpen) {
        const startSlot = timeToSlotIndex(openingHours[`${dayKey}_OPENING_HOUR`]);
        // Ajuste: El cierre "00:00" del día siguiente es slot 48 (o totalSlots)
        let endSlot = timeToSlotIndex(openingHours[`${dayKey}_CLOSING_HOUR`]);
        
        // Lógica para horarios que terminan a medianoche (ej: 08:00 a 00:00)
        // Ojo: Tu API guarda "23:00" si cierra a las 23:00, "02:00" si cierra a las 02:00
        // Asumimos que la lógica de la API es "horario de inicio en este día" y "horario de fin en este día"
        // Si el horario cruza la medianoche (ej 8:00 a 2:00), la API guardaría:
        // LUNES: 08:00 - 23:30 (o 24:00) y MARTES: 00:00 - 02:00
        
        // Esta grilla simplifica eso:
        // LUNES: pintado de 08:00 a 23:30
        // MARTES: pintado de 00:00 a 02:00
        
        if (startSlot === -1 || endSlot === -1) {
           // Si el horario es 00:00 a 00:00, puede ser todo el día o nada del día.
           // Si es 00:00 a 00:00 pero IS_OPEN es true, asumimos 24h
           if (startSlot === 0 && endSlot === 0 && isOpen) {
             for (let i = 0; i < totalSlots; i++) daySlots[i] = true;
           }
           // Si no, lo dejamos cerrado (ya está en false)
        }
        else if (startSlot < endSlot) {
          // Caso normal (ej: 08:00 a 17:00)
          for (let i = startSlot; i < endSlot; i++) daySlots[i] = true;
        } else if (startSlot > endSlot) {
          // Caso de medianoche (ej: 20:00 a 04:00)
          // Esto es lo que tu API maneja mal. La grilla lo soporta visualmente.
          // LUN: 20:00 - 23:30
          for (let i = startSlot; i < totalSlots; i++) daySlots[i] = true;
          // MAR: 00:00 - 04:00 (esto debe estar en la fila de Martes)
          // La API lo guarda así: LUN_CLOSING_HOUR: 04:00 (del día siguiente)
          // PERO TU API TIENE CAMPOS POR DÍA.
          // La única forma de que tu API actual funcione es:
          // LUNES: 08:00 a 23:30 (o 24:00)
          // MARTES: 00:00 a 02:00
          
          // El "de-traductor" debe ser simple y reflejar lo que la API guarda:
          for (let i = startSlot; i < endSlot; i++) daySlots[i] = true;
        }
      }
      return daySlots;
    });
    setGrid(newGrid);
  }, [openingHours, slotDuration, totalSlots]); // Recalcular si cambian las props

  // --- 2. Lógica de "Pintar" ---
  const handleMouseDown = (dayIndex, slotIndex) => {
    setIsPainting(true);
    const currentMode = !grid[dayIndex][slotIndex]; // Pinta lo opuesto a la celda clickeada
    setPaintMode(currentMode);
    toggleCell(dayIndex, slotIndex, currentMode);
  };

  const handleMouseEnter = (dayIndex, slotIndex) => {
    if (isPainting) {
      toggleCell(dayIndex, slotIndex, paintMode);
    }
  };

  const handleMouseUp = () => {
    if (isPainting) {
      setIsPainting(false);
      // Cuando terminamos de pintar, "traducimos" la grilla a los 21 campos
      translateGridToApi();
    }
  };
  
  // Función helper para actualizar el estado de la grilla
  const toggleCell = (dayIndex, slotIndex, newState) => {
    setGrid(prevGrid => {
      // Evitar mutación del estado
      const newGrid = prevGrid.map(day => [...day]); 
      newGrid[dayIndex][slotIndex] = newState;
      return newGrid;
    });
  };

  // --- 3. "Traductor" (Grilla Visual -> API) ---
  // Convierte la grilla visual de 7x48 a los 21 campos que la API entiende
  const translateGridToApi = useCallback(() => {
    const slotIndexToTime = (index) => {
      const totalMinutes = index * slotDuration;
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const newSchedule = {};
    
    grid.forEach((daySlots, dayIndex) => {
      const dayKey = DAYS_OF_WEEK[dayIndex];
      
      const firstOpenSlot = daySlots.indexOf(true);
      const lastOpenSlot = daySlots.lastIndexOf(true);

      if (firstOpenSlot === -1) {
        // Día completamente cerrado
        newSchedule[`${dayKey}_IS_OPEN`] = "false";
        newSchedule[`${dayKey}_OPENING_HOUR`] = "00:00";
        newSchedule[`${dayKey}_CLOSING_HOUR`] = "00:00";
      } else {
        // Día abierto
        newSchedule[`${dayKey}_IS_OPEN`] = "true";
        newSchedule[`${dayKey}_OPENING_HOUR`] = slotIndexToTime(firstOpenSlot);
        
        // El horario de cierre es el *inicio* del siguiente slot
        // Ej: si el último slot es 22:30, el cierre es 23:00
        const closingTime = slotIndexToTime(lastOpenSlot + 1);
        newSchedule[`${dayKey}_CLOSING_HOUR`] = closingTime === '24:00' ? '00:00' : closingTime;
      }
    });

    // Llamar al callback de SettingsPage con los datos traducidos
    onScheduleChange(newSchedule);
  }, [grid, slotDuration, onScheduleChange, totalSlots]);


  // --- Renderizado de la Grilla ---
  if (!grid.length) return <div>Cargando grilla...</div>;

  const renderHeaders = () => {
    const headers = [];
    for (let h = 0; h < 24; h++) {
      headers.push(
        <div 
          key={h} 
          className="text-center text-xs text-gray-500"
          style={{ gridColumn: `span ${(60 / slotDuration)}` }} // Ocupa 2 celdas si slot=30
        >
          {String(h).padStart(2, '0')}:00
        </div>
      );
    }
    return headers;
  };

  return (
    <div className="overflow-x-auto" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
      <div 
        className="grid items-center gap-px"
        style={{ gridTemplateColumns: `60px repeat(${totalSlots}, minmax(10px, 1fr))` }}
      >
        {/* Fila de Headers (Horas) */}
        <div /> {/* Celda vacía para la esquina */}
        <div 
          className="col-span-48 grid" 
          style={{ gridTemplateColumns: `repeat(24, 1fr)` }}
        >
          {renderHeaders()}
        </div>

        {/* Filas de Días y Slots */}
        {DAY_NAMES_ES.map((dayName, dayIndex) => (
          <React.Fragment key={dayIndex}>
            {/* Nombre del Día */}
            <div className="text-sm font-medium text-gray-600 text-right pr-2">{dayName}</div>
            
            {/* Celdas de Horarios */}
            {grid[dayIndex].map((isOpen, slotIndex) => (
              <ScheduleCell
                key={slotIndex}
                isOpen={isOpen}
                onMouseDown={() => handleMouseDown(dayIndex, slotIndex)}
                onMouseEnter={() => handleMouseEnter(dayIndex, slotIndex)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ScheduleGrid;
