import React, { useState, useEffect } from 'react';
import { courtService } from '../../services/courtService';

const CourtFormModal = ({ court, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    courtType: 'Cemento',
    pricePerHour: '',
    isActive: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!court;

  useEffect(() => {
    if (isEditMode) {
      setFormData({
        name: court.name,
        courtType: court.courtType,
        pricePerHour: court.pricePerHour,
        isActive: court.isActive,
      });
    }
  }, [court, isEditMode]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isEditMode) {
        await courtService.updateCourt(court._id, formData);
      } else {
        await courtService.createCourt(formData);
      }
      onSuccess();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar la cancha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-primary mb-6">{isEditMode ? 'Editar Cancha' : 'Añadir Cancha'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-text-secondary">Nombre de la Cancha</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div>
            <label htmlFor="courtType" className="block text-sm font-medium text-text-secondary">Tipo de Superficie</label>
            <select name="courtType" value={formData.courtType} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
              <option>Cemento</option>
              <option>Césped Sintético</option>
              <option>Cristal</option>
            </select>
          </div>
          <div>
            <label htmlFor="pricePerHour" className="block text-sm font-medium text-text-secondary">Precio por Hora</label>
            <input type="number" name="pricePerHour" value={formData.pricePerHour} onChange={handleChange} required min="0" step="0.01" className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div className="flex items-center gap-4">
            <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleChange} className="h-4 w-4 rounded border-gray-600 bg-dark-primary text-primary focus:ring-primary" />
            <label htmlFor="isActive" className="text-sm text-text-secondary">Cancha activa</label>
          </div>
          {error && <p className="text-danger text-sm text-center">{error}</p>}
          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors disabled:opacity-50">
              {loading ? 'Guardando...' : 'Guardar Cancha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourtFormModal;
