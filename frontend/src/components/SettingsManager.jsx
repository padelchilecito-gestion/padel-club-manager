import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente para la zona de peligro
const DangerZone = () => {
    const [collections, setCollections] = useState([]);
    const [confirmationText, setConfirmationText] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [error, setError] = useState('');

    const handleCheckboxChange = (e) => {
        const { value, checked } = e.target;
        if (checked) {
            setCollections([...collections, value]);
        } else {
            setCollections(collections.filter(c => c !== value));
        }
    };

    const openConfirmationModal = () => {
        if (collections.length > 0) {
            setIsModalOpen(true);
            setError('');
            setConfirmationText('');
        } else {
            alert('Por favor, selecciona al menos una categoría de datos para borrar.');
        }
    };

    const handleClearData = async () => {
        if (confirmationText !== 'BORRAR DATOS') {
            setError('El texto de confirmación no es correcto.');
            return;
        }

        try {
            const res = await axios.post('/admin-tasks/clear-collections', {
                collectionsToClear: collections
            });
            alert(`¡Éxito! Se limpiaron las siguientes colecciones: ${res.data.cleared.join(', ')}`);
            setIsModalOpen(false);
            setCollections([]);
            setError('');
        } catch (err) {
            alert(err.response?.data?.message || 'Ocurrió un error al limpiar los datos.');
        }
    };

    const options = [
        { id: 'bookings', label: 'Todas las Reservas' },
        { id: 'sales', label: 'Todas las Ventas' },
        { id: 'products', label: 'Todos los Productos (Inventario)' },
        { id: 'fixedbookings', label: 'Reglas de Turnos Fijos' },
        { id: 'cashboxsessions', label: 'Historial de Cajas' },
        { id: 'activitylogs', label: 'Registro de Actividad' }
    ];

    return (
        <div className="mt-12 border-t-2 border-danger pt-6">
            <h3 className="text-2xl font-bold text-danger mb-2">⚠️ Zona de Peligro</h3>
            <p className="text-text-secondary mb-4">
                Las siguientes acciones son irreversibles. Úsalas con extrema precaución, por ejemplo, para reiniciar el sistema antes de un lanzamiento.
            </p>
            <div className="bg-dark-primary p-4 rounded-lg">
                <h4 className="font-bold text-lg mb-2">Limpiar Datos de la Aplicación</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {options.map(opt => (
                        <label key={opt.id} className="flex items-center gap-2">
                            <input type="checkbox" value={opt.id} onChange={handleCheckboxChange} className="w-4 h-4 rounded" />
                            {opt.label}
                        </label>
                    ))}
                </div>
                <button
                    onClick={openConfirmationModal}
                    className="w-full bg-danger text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700"
                >
                    Limpiar Datos Seleccionados
                </button>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
                    <div className="bg-dark-secondary p-8 rounded-lg max-w-lg w-full">
                        <h3 className="text-2xl font-bold text-danger mb-4">Confirmación Requerida</h3>
                        <p className="mb-4">Esta acción **eliminará permanentemente** los datos seleccionados. No se podrá deshacer.</p>
                        <p className="mb-4">Para confirmar, escribe **<span className="font-mono text-secondary">BORRAR DATOS</span>** en el siguiente campo:</p>
                        <input
                            type="text"
                            value={confirmationText}
                            onChange={(e) => setConfirmationText(e.target.value)}
                            className="w-full p-2 font-mono text-black"
                        />
                        {error && <p className="text-danger mt-2">{error}</p>}
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="w-full bg-gray-600 py-2 rounded-lg">Cancelar</button>
                            <button onClick={handleClearData} className="w-full bg-danger text-white font-bold py-2 rounded-lg">Confirmar y Borrar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const SettingsManager = () => {
    const [settings, setSettings] = useState({
        mercadoPagoPublicKey: '',
        mercadoPagoAccessToken: '',
        whatsappNumber: '' // Nuevo estado
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/settings');
                if (res.data) {
                    setSettings({
                        mercadoPagoPublicKey: res.data.mercadoPagoPublicKey || '',
                        mercadoPagoAccessToken: res.data.mercadoPagoAccessToken || '',
                        whatsappNumber: res.data.whatsappNumber || '' // Cargar número
                    });
                }
            } catch (error) {
                setMessage('Error: No se pudo cargar la configuración.');
            }
        };
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        setSettings({ ...settings, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        try {
            await axios.post('/settings', settings);
            setMessage('¡Configuración guardada con éxito!');
        } catch (error) {
            setMessage('Error: No se pudo guardar la configuración.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade-in">
            {/* ... Título y descripción sin cambios ... */}
            
            <form onSubmit={handleSubmit} className="bg-dark-secondary p-6 rounded-lg space-y-4">
                <div>
                    <label htmlFor="whatsappNumber" className="block mb-1 text-text-secondary">Número de WhatsApp para Notificaciones</label>
                    <input
                        type="text"
                        id="whatsappNumber"
                        name="whatsappNumber"
                        value={settings.whatsappNumber}
                        onChange={handleChange}
                        className="w-full p-2 text-black"
                        placeholder="Ej: 5493825123456 (con código de país y área)"
                    />
                </div>
                <div>
                    <label htmlFor="mercadoPagoPublicKey" className="block mb-1 text-text-secondary">Public Key (Mercado Pago)</label>
                    <input
                        type="text"
                        id="mercadoPagoPublicKey"
                        name="mercadoPagoPublicKey"
                        value={settings.mercadoPagoPublicKey}
                        onChange={handleChange}
                        className="w-full p-2 text-black"
                        placeholder="APP_USR-..."
                    />
                </div>
                <div>
                    <label htmlFor="mercadoPagoAccessToken" className="block mb-1 text-text-secondary">Access Token (Mercado Pago)</label>
                    <input
                        type="password" 
                        id="mercadoPagoAccessToken"
                        name="mercadoPagoAccessToken"
                        value={settings.mercadoPagoAccessToken}
                        onChange={handleChange}
                        className="w-full p-2 text-black"
                        placeholder="************"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-dark transition disabled:bg-gray-500"
                >
                    {loading ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </form>
            <DangerZone />
        </div>
    );
};

export default SettingsManager;