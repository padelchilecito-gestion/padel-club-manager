import React, { useState, useEffect } from 'react';
// --- LÍNEA CORREGIDA ---
// Importamos las funciones específicas en lugar del objeto 'courtService'
import { createCourt, updateCourt } from '../../services/courtService';
// --- FIN DE CORRECCIÓN ---

const CourtFormModal = ({ court, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'classic', // 'classic', 'panoramic'
    price: '',
    availableSlots: [], // ['09:00', '10:30', ...]
    status: 'available', // 'available', 'maintenance'
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [slotInput, setSlotInput] = useState(''); // Para el input de slots

  useEffect(() => {
    if (court) {
      setFormData({
        name: court.name,
        type: court.type,
        price: court.price.toString(),
        availableSlots: court.availableSlots || [],
        status: court.status,
      });
    }
  }, [court]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSlot = () => {
    if (slotInput && /^\d{2}:\d{2}$/.test(slotInput) && !formData.availableSlots.includes(slotInput)) {
      setFormData((prev) => ({
        ...prev,
        availableSlots: [...prev.availableSlots, slotInput].sort(),
      }));
      setSlotInput('');
    }
  };

  const handleRemoveSlot = (slotToRemove) => {
    setFormData((prev) => ({
      ...prev,
      availableSlots: prev.availableSlots.filter((slot) => slot !== slotToRemove),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const dataToSubmit = {
        ...formData,
        price: parseFloat(formData.price),
      };

      // --- LÍNEA CORREGIDA ---
      // Llamamos a las funciones importadas directamente
      const serviceCall = court
        ? updateCourt(court._id, dataToSubmit)
        : createCourt(dataToSubmit);
      // --- FIN DE CORRECCIÓN ---

      await serviceCall;
      onSuccess(); // Cierra el modal y refresca la lista
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al guardar la cancha');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <h3 className="text-xl font-semibold text-white mb-4">
              {court ? 'Editar Cancha' : 'Nueva Cancha'}
            </h3>

            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <InputField label="Nombre" name="name" value={formData.name} onChange={handleChange} required />
              
              <SelectField
                label="Tipo"
                name="type"
                value={formData.type}
                onChange={handleChange}
                options={[
                  { value: 'classic', label: 'Clásica (Muro)' },
                  { value: 'panoramic', label: 'Panorámica (Blindex)' },
                ]}
              />

              <InputField label="Precio" name="price" type="number" value={formData.price} onChange={handleChange} required />
              
              <SelectField
                label="Estado"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={[
                  { value: 'available', label: 'Disponible' },
                  { value: 'maintenance', label: 'Mantenimiento' },
                ]}
              />

              {/* Gestión de Slots */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Horarios Disponibles</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="time"
                    value={slotInput}
                    onChange={(e) => setSlotInput(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md shadow-sm text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSlot}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700"
                  >
                    Añadir
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 p-2 bg-gray-900 rounded-md min-h-[40px] border border-gray-700">
                  {formData.availableSlots.length === 0 ? (
                    <span className="text-gray-500 text-sm p-2">Añade horarios (ej: 09:00, 10:30)</span>
                  ) : (
                    formData.availableSlots.map((slot) => (
                      <span
                        key={slot}
                        className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {slot}
                        <button
                          type="button"
                          onClick={() => handleRemoveSlot(slot)}
                          className="text-indigo-200 hover:text-white"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer del Modal */}
          <div className="bg-gray-750 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed"
            >
              {isLoading ? (court ? 'Guardando...' : 'Creando...') : (court ? 'Guardar Cambios' : 'Crear Cancha')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componentes helper para inputs
const InputField = ({ label, name, type = 'text', value, onChange, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md shadow-sm text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    />
  </div>
);

const SelectField = ({ label, name, value, onChange, options, required = false }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <select
      id={name}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-md shadow-sm text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

export default CourtFormModal;
