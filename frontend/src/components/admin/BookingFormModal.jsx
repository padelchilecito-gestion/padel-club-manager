// ... (imports)
// ¡Asegúrate de importar useEffect!)
import React, { useState, useEffect } from 'react'; 
// ...

const BookingFormModal = ({ booking, onClose, onSuccess }) => {
  // ... (otros estados)

  useEffect(() => {
    // ... (fetchCourts)
  }, [booking, isEditMode]);

  // --- NUEVO EFECTO ---
  // Autocalcular el precio si no estamos en modo edición
  useEffect(() => {
    if (!isEditMode && formData.courtId && formData.duration && courts.length > 0) {
      const court = courts.find(c => c._id === formData.courtId);
      if (court) {
        const pricePerMinute = court.pricePerHour / 60;
        const calculatedPrice = pricePerMinute * parseInt(formData.duration, 10);
        
        setFormData(prev => ({
          ...prev,
          price: calculatedPrice.toFixed(2) // Aseguramos 2 decimales
        }));
      }
    }
  }, [formData.courtId, formData.duration, courts, isEditMode]);
  // --------------------

  const handleChange = (e) => {
    // ...
  };

  const handleSubmit = async (e) => {
    // ...
  };

  return (
    <div /* ... (modal wrapper) */>
      <div /* ... (modal content) */>
        {/* ... (otros campos del formulario) ... */}
           <div className="grid grid-cols-2 gap-4">
            <div>
              {/* ... (select de Duración) ... */}
            </div>
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-text-secondary">Precio</label>
              <input 
                type="number" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                required 
                min="0" 
                // Añadimos 'readOnly' si el precio se calcula (no en modo edición)
                // Opcional: puedes hacerlo editable si lo prefieres
                readOnly={!isEditMode}
                className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600 disabled:opacity-70" 
              />
            </div>
          </div>
          {/* ... (resto del formulario) ... */}
      </div>
    </div>
  );
};
