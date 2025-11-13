import React, { useState } from 'react';
import { userService } from '../../services/userService';

const UserRoleModal = ({ user, onClose, onSuccess }) => {
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await userService.updateUserRole(user._id, role);
      onSuccess(); // Esto refrescará la lista en UsersPage
    } catch (err) {
      setError(err.response?.data?.message || 'Ocurrió un error al actualizar el rol.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-dark-secondary p-8 rounded-lg shadow-xl w-full max-w-lg">
        <h2 className="text-2xl font-bold text-primary mb-6">Editar Rol de Usuario</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary">Usuario</label>
            <p className="text-lg text-text-primary font-semibold">{user.username}</p>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-text-secondary">Rol</label>
            <select 
              name="role" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              className="w-full mt-1 bg-dark-primary p-2 rounded-md border border-gray-600"
            >
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
              {loading ? 'Actualizando...' : 'Actualizar Rol'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserRoleModal;
