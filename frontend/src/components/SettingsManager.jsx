import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
                        className="w-full p-2"
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
                        className="w-full p-2"
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
                        className="w-full p-2"
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
        </div>
    );
};

export default SettingsManager;