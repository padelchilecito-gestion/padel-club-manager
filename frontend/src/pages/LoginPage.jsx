import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        const success = await login(username, password);
        if (success) {
            navigate('/admin');
        } else {
            setError('Usuario o contraseña incorrectos.');
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-dark-primary p-4">
            <div className="w-full max-w-md p-8 space-y-6 bg-dark-secondary rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-3xl font-bold text-center text-text-primary font-title">
                    Acceso Administrador
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && <p className="text-danger text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
                    <div>
                        <label htmlFor="username" className="text-sm font-bold text-text-secondary">Usuario:</label>
                        <input
                            type="text"
                            id="username"
                            name="username"
                            autoComplete="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full p-3 mt-1 bg-dark-primary rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Contraseña:</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-3 mt-1 bg-dark-primary rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition shadow-primary hover:shadow-primary-hover disabled:bg-gray-500"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;