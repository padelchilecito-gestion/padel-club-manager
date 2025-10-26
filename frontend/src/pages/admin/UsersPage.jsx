import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import UserFormModal from '../../components/admin/UserFormModal';
import { TrashIcon } from '@heroicons/react/24/solid';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user: currentUser } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (err) {
      setError('No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    fetchUsers(); // Refetch users after a successful creation
    handleCloseModal();
  };

  const handleDelete = async (userId) => {
    if (userId === currentUser._id) {
        alert('No puedes eliminar tu propia cuenta.');
        return;
    }
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción es irreversible.')) {
      try {
        await userService.deleteUser(userId);
        alert('Usuario eliminado con éxito.');
        fetchUsers(); // Refetch
      } catch (err) {
        alert(err.message || 'Error al eliminar el usuario.');
      }
    }
  };
  
  if (loading) return <div className="text-center p-8">Cargando usuarios...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary mb-4 md:mb-0">Gestión de Usuarios</h1>
        <button
          onClick={handleOpenModal}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg transition-colors"
        >
          Añadir Usuario
        </button>
      </div>

      <div className="bg-dark-secondary shadow-2xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-primary uppercase bg-dark-primary/50">
              <tr>
                <th scope="col" className="px-6 py-4 hidden md:table-cell">ID de Usuario</th>
                <th scope="col" className="px-6 py-4">Nombre de Usuario</th>
                <th scope="col" className="px-6 py-4">Rol</th>
                <th scope="col" className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-dark-primary/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs hidden md:table-cell">{user._id}</td>
                  <td className="px-6 py-4 font-medium text-text-primary">{user.username}</td>
                  <td className="px-6 py-4">
                     <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'Admin' ? 'bg-primary text-white' : 'bg-secondary text-dark-primary'
                    }`}>
                        {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {user._id !== currentUser._id && (
                      <button onClick={() => handleDelete(user._id)} className="text-danger hover:text-red-400 transition-colors" title="Eliminar Usuario">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      {isModalOpen && (
        <UserFormModal
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default UsersPage;
