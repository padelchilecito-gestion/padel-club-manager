import React, { useState, useEffect } from 'react';
// Importamos las funciones específicas
import { createCourt, updateCourt } from '../../services/courtService';

const CourtFormModal = ({ court, onClose, onSuccess }) => {
  // Estado inicial con los nombres CORRECTOS y SIN availableSlots
  const [formData, setFormData] = useState({
    name: '',
    courtType: 'classic', // Nombre correcto
    pricePerHour: '',   // Nombre correcto
    status: 'available',
  });
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (court) {
      setFormData({
        name: court.name || '',
        courtType: court.courtType || court.type || 'classic', // Usar nombre nuevo, con fallback
        pricePerHour: court.pricePerHour ? court.pricePerHour.toString() : (court.price ? court.price.toString() : ''), // Usar nombre nuevo, con fallback
        status: court.status || 'available',
        // No incluir availableSlots aquí
      });
    } else {
      // Resetear para 'Nueva Cancha'
      setFormData({
        name: '',
        courtType: 'classic',
        pricePerHour: '',
        status: 'available',
      });
    }
  }, [court]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      // Construir objeto con nombres CORRECTOS y SIN availableSlots
      const dataToSubmit = {
        name: formData.name,
        courtType: formData.courtType, // Nombre correcto
        pricePerHour: parseFloat(formData.pricePerHour), // Nombre correcto
        status: formData.status,
        // No incluir availableSlots aquí
      };

      const serviceCall = court
        ? updateCourt(court._id, dataToSubmit)
        : createCourt(dataToSubmit);

      await serviceCall;
      onSuccess();
    } catch (err) {
      // Manejar el error de validación específico
      if (err.response && err.response.status === 400 && err.response.data.message.includes('validation failed')) {
         setError(`Error de validación: ${err.response.data.message}. Verifica los campos.`);
      } else {
        setError(err.response?.data?.message || err.message || 'Error al guardar la cancha');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Contenedor principal del modal */}
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Encabezado del Modal */}
        <div className="p-6 border-b border-gray-700">
            <h3 className="text-xl font-semibold text-white">
              {court ? 'Editar Cancha' : 'Nueva Cancha'}
            </h3>
        </div>

        {/* Cuerpo del Modal (Scrollable) */}
        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
          <div className="p-6">
            {error && (
              <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative mb-4" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
                <button type="button" onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-100 hover:text-white">&times;</button>
              </div>
            )}

            <div className="space-y-4">
              {/* Campos del formulario con los nombres CORRECTOS */}
              <InputField label="Nombre" name="name" value={formData.name} onChange={handleChange} required />

              <SelectField
                label="Tipo"
                name="courtType" // Nombre correcto
                value={formData.courtType}
                onChange={handleChange}
                options={[
                  { value: 'classic', label: 'Clásica (Muro)' },
                  { value: 'panoramic', label: 'Panorámica (Blindex)' },
                ]}
              />

              <InputField label="Precio por Hora" name="pricePerHour" type="number" value={formData.pricePerHour} onChange={handleChange} required step="0.01" min="0"/> {/* Nombre correcto */}

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

              {/* SECCIÓN DE HORARIOS ELIMINADA */}

            </div>
          </div>
        </form>

        {/* Footer del Modal */}
        <div className="bg-gray-750 px-6 py-4 flex justify-end gap-3 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            {/* Llamar a handleSubmit desde aquí */}
            <button
              type="button" // Cambiado a button para que no envíe el form dos veces
              onClick={handleSubmit} // Llamar a la función al hacer clic
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed"
            >
              {isLoading ? (court ? 'Guardando...' : 'Creando...') : (court ? 'Guardar Cambios' : 'Crear Cancha')}
            </button>
        </div>
      </div>
    </div>
  );
};

// --- Componentes Helper (sin cambios funcionales, solo asegurar que 'name' es correcto) ---
const InputField = ({ label, name, type = 'text', value, onChange, required = false, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name} // Asegurar que el 'name' HTML coincide
      value={value}
      onChange={onChange}
      required={required}
      {...props} // Pasar props adicionales como step, min
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
      name={name} // Asegurar que el 'name' HTML coincide
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