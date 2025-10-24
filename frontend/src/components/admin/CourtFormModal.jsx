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
    // Si estamos editando, cargar datos existentes
    if (court) {
      setFormData({
        name: court.name || '',
        // Usar nombres nuevos del backend, con fallback a los viejos si existen
        courtType: court.courtType || court.type || 'classic',
        pricePerHour: court.pricePerHour ? court.pricePerHour.toString() : (court.price ? court.price.toString() : ''),
        status: court.status || 'available',
        // No cargar availableSlots
      });
    } else {
      // Si estamos creando, usar estado inicial limpio
      setFormData({
        name: '',
        courtType: 'classic',
        pricePerHour: '',
        status: 'available',
      });
    }
  }, [court]); // Ejecutar solo cuando 'court' cambie

  // Manejador genérico para inputs y selects
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejador del envío del formulario
  const handleSubmit = async (e) => {
    // Prevenir envío por defecto si se llama desde el <form> (aunque lo llamaremos desde el botón)
    if (e) e.preventDefault();
    
    setIsLoading(true);
    setError(null);
    try {
      // Construir objeto a enviar con nombres CORRECTOS
      const dataToSubmit = {
        name: formData.name,
        courtType: formData.courtType, // Nombre correcto
        pricePerHour: parseFloat(formData.pricePerHour), // Nombre correcto y convertir a número
        status: formData.status,
        // No enviar availableSlots
      };

      // Validar precio antes de enviar
      if (isNaN(dataToSubmit.pricePerHour) || dataToSubmit.pricePerHour < 0) {
        throw new Error('El precio por hora debe ser un número válido mayor o igual a cero.');
      }
      if (!dataToSubmit.name || !dataToSubmit.courtType || !dataToSubmit.status) {
         throw new Error('Nombre, Tipo y Estado son campos obligatorios.');
      }


      // Determinar si crear o actualizar
      const serviceCall = court
        ? updateCourt(court._id, dataToSubmit)
        : createCourt(dataToSubmit);

      await serviceCall;
      onSuccess(); // Llamar a la función de éxito (cerrar modal, refrescar lista)

    } catch (err) {
      // Mostrar mensaje de error específico de validación si es un 400
      if (err.response && err.response.status === 400) {
         // Acceder al mensaje de error dentro de la respuesta de Mongoose si existe
         const message = err.response.data.message || 'Error de validación. Verifica los campos.';
         // A veces Mongoose anida el error, intentamos mostrarlo
         if (err.response.data.errors) {
            const firstErrorKey = Object.keys(err.response.data.errors)[0];
            const nestedMessage = err.response.data.errors[firstErrorKey]?.message;
            setError(`Error de validación: ${nestedMessage || message}`);
         } else {
            setError(`Error de validación: ${message}`);
         }
      } else {
        // Mostrar otros errores (incluyendo errores de validación local)
        setError(err.response?.data?.message || err.message || 'Error al guardar la cancha');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Overlay del modal
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Contenedor principal del modal */}
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* Encabezado Fijo */}
        <div className="p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">
            {court ? 'Editar Cancha' : 'Nueva Cancha'}
          </h3>
        </div>

        {/* Cuerpo Scrollable */}
        <div className="flex-grow overflow-y-auto p-6">
          {error && (
            <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg relative mb-4" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              {/* Botón para cerrar el error */}
              <button type="button" onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 text-red-100 hover:text-white">&times;</button>
            </div>
          )}

          {/* Formulario (sin etiqueta <form> aquí para controlar envío con botón) */}
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
              required
            />

            <InputField
              label="Precio por Hora"
              name="pricePerHour" // Nombre correcto
              type="number"
              value={formData.pricePerHour}
              onChange={handleChange}
              required
              step="0.01" // Permitir decimales
              min="0" // No permitir precios negativos
            />

            <SelectField
              label="Estado"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'available', label: 'Disponible' },
                { value: 'maintenance', label: 'Mantenimiento' },
              ]}
              required
            />

            {/* SECCIÓN DE HORARIOS DISPONIBLES HA SIDO ELIMINADA */}

          </div>
        </div>

        {/* Footer Fijo */}
        <div className="bg-gray-750 px-6 py-4 flex justify-end gap-3 border-t border-gray-700">
          <button
            type="button" // Botón normal, no submit
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-gray-600 text-white rounded-md font-semibold hover:bg-gray-500 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button" // Botón normal, llama a handleSubmit al hacer clic
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700 disabled:bg-indigo-900 disabled:cursor-not-allowed"
          >
            {/* Texto dinámico del botón */}
            {isLoading ? (court ? 'Guardando...' : 'Creando...') : (court ? 'Guardar Cambios' : 'Crear Cancha')}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Componentes Helper ---
const InputField = ({ label, name, type = 'text', value, onChange, required = false, ...props }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-300 mb-1">
      {label}
    </label>
    <input
      type={type}
      id={name}
      name={name} // Importante que coincida
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
      name={name} // Importante que coincida
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
