import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

// --- Iconos para los roles (puedes usar una librería como FontAwesome si ya la tienes) ---
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const OperatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;


const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({ username: '', password: '', role: 'Operator' });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const fetchUsers = useCallback(async () => {
        try {
            const res = await axios.get('/users');
            setUsers(res.data);
        } catch (err) {
            setError('No se pudieron cargar los usuarios.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    // Ocultar mensaje de éxito después de 3 segundos
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const handleChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async e => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        try {
            await axios.post('/users', formData);
            setSuccessMessage(`¡Usuario "${formData.username}" creado con éxito!`);
            fetchUsers();
            setFormData({ username: '', password: '', role: 'Operator' });
        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear el usuario.');
        }
    };
    
    const handleDelete = async (id, username) => {
        if (window.confirm(`¿Estás seguro de que quieres eliminar a ${username}? Esta acción no se puede deshacer.`)) {
            try {
                await axios.delete(`/users/${id}`);
                setSuccessMessage(`Usuario "${username}" eliminado.`);
                fetchUsers();
            } catch (err) {
                setError('Error al eliminar el usuario.');
            }
        }
    };

    // Filtra los usuarios según el término de búsqueda
    const filteredUsers = useMemo(() =>
        users.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        ), [users, searchTerm]);

    return (
        <div className="animate-fade-in">
            {/* Mensajes de feedback */}
            {error && <p className="text-danger bg-red-900/50 p-3 rounded-lg mb-4 text-center">{error}</p>}
            {successMessage && <p className="text-secondary bg-green-900/50 p-3 rounded-lg mb-4 text-center">{successMessage}</p>}

            {/* Formulario de creación de usuario */}
            <div className="bg-dark-secondary p-6 rounded-lg mb-8">
                 <h3 className="text-xl font-bold mb-4 text-secondary">Agregar Nuevo Usuario</h3>
                 <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className='md:col-span-2'>
                        <label className="text-sm text-text-secondary">Nombre de Usuario</label>
                        <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full mt-1 p-2" required />
                    </div>
                    <div>
                        <label className="text-sm text-text-secondary">Contraseña</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full mt-1 p-2" required />
                    </div>
                     <div>
                        <label className="text-sm text-text-secondary">Rol</label>
                        <select name="role" value={formData.role} onChange={handleChange} className="w-full mt-1 p-2">
                            <option value="Operator">Operador</option>
                            <option value="Admin">Administrador</option>
                        </select>
                    </div>
                    <div className="md:col-span-4">
                        <button type="submit" className="w-full bg-primary text-white font-bold py-2 px-4 rounded hover:bg-primary-dark transition-transform transform hover:scale-105">Crear Usuario</button>
                    </div>
                </form>
            </div>
            
            {/* Lista de usuarios existentes */}
            <div>
                 <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-secondary">Usuarios Existentes</h3>
                    <input
                        type="text"
                        placeholder="Buscar usuario..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 bg-dark-primary rounded-lg border border-gray-600"
                    />
                 </div>
                {loading ? <p className="text-center">Cargando usuarios...</p> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map(user => (
                            <div key={user._id} className="bg-dark-secondary p-5 rounded-lg shadow-lg flex flex-col items-center text-center transition-transform transform hover:-translate-y-1">
                                <div className={`mb-3 p-3 rounded-full ${user.role === 'Admin' ? 'bg-secondary/20 text-secondary' : 'bg-blue-500/20 text-blue-400'}`}>
                                    {user.role === 'Admin' ? <AdminIcon /> : <OperatorIcon />}
                                </div>
                                <p className="font-bold text-lg text-text-primary">{user.username}</p>
                                <p className="text-sm font-semibold text-text-secondary mb-4">{user.role}</p>
                                <button
                                    onClick={() => handleDelete(user._id, user.username)}
                                    className="mt-auto bg-danger/80 text-white px-4 py-1 rounded-md text-sm hover:bg-danger w-full"
                                >
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                 {filteredUsers.length === 0 && !loading && (
                    <p className="text-center text-text-secondary py-8">No se encontraron usuarios.</p>
                )}
            </div>
        </div>
    );
};

export default UserManager;