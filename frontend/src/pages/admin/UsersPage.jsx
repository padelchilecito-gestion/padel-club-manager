import React, { useState, useEffect } from 'react';
import { userService } from '../../services/userService';
import { useAuth } from '../../contexts/AuthContext';
import UserFormModal from '../../components/admin/UserFormModal';
import UserRoleModal from '../../components/admin/UserRoleModal'; 
import { TrashIcon, PencilIcon } from '@heroicons/react/24/solid'; 

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); 
  const [selectedUser, setSelectedUser] = useState(null); 
  
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

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleOpenEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setSelectedUser(null);
    setIsEditModalOpen(false);
  };

  const handleSuccess = () => {
    fetchUsers(); 
    handleCloseCreateModal();
    handleCloseEditModal(); 
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
    <div>
      {/* --- HEADER MODIFICADO --- */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Gestión de Usuarios</h1>
        <button
          onClick={handleOpenCreateModal}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors w-full md:w-auto"
        >
          Añadir Usuario
        </button>
      </div>

      <div className="bg-dark-secondary shadow-lg rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs text-text-primary uppercase bg-dark-primary">
            <tr>
              <th scope="col" className="px-6 py-3">ID de Usuario</th>
              <th scope="col" className="px-6 py-3">Nombre de Usuario</th>
              <th scope="col" className="px-6 py-3">Rol</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} className="border-b border-gray-700 hover:bg-dark-primary">
                <td className="px-6 py-4 font-mono text-xs">{user._id}</td>
                <td className="px-6 py-4 font-medium text-text-primary">{user.username}</td>
                <td className="px-6 py-4">
                   <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'Admin' ? 'bg-primary text-white' : 'bg-secondary text-dark-primary'
                  }`}>
                      {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-4">
                  {user._id !== currentUser._id ? (
                    <>
                      <button onClick={() => handleOpenEditModal(user)} className="text-blue-400 hover:text-blue-300" title="Editar Rol">
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(user._id)} className="text-danger hover:text-red-400" title="Eliminar Usuario">
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs italic text-gray-500"> (Tú) </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isCreateModalOpen && (
        <UserFormModal
          onClose={handleCloseCreateModal}
          onSuccess={handleSuccess}
        />
      )}

      {isEditModalOpen && selectedUser && (
        <UserRoleModal
          user={selectedUser}
          onClose={handleCloseEditModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default UsersPage;
