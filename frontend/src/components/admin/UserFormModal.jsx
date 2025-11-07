import React, { useState } from 'react';
import { userService } from '../../services/userService';

const UserFormModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'Operator',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.password) {
        setError('La contraseña es obligatoria.');
        return;
    }
    setLoading(true);
    setError('');

    try {
      await userService.createUser(formData);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al crear el usuario.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-primary mb-6">Añadir Nuevo Usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-text-secondary">Nombre de Usuario</label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">Contraseña</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600" />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-secondary">Rol</label>
            <select name="role" value={formData.role} onChange={handleChange} className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600">
              <option value="Operator">Operador</option>
              <option value="Admin">Administrador</option>
            </select>
          </div>
          
          {error && <p className="text-danger text-sm text-center">{error}</p>}

          <div className="flex justify-end gap-4 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-md transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white font-bold rounded-md transition-colors disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
