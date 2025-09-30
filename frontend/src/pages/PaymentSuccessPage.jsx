import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentSuccessPage = () => {
    const location = useLocation();

    useEffect(() => {
        // Limpiamos el ID de pago pendiente del localStorage para evitar reutilizarlo.
        // La notificación ahora se gestiona 100% desde el backend a través del webhook.
        const queryParams = new URLSearchParams(location.search);
        const status = queryParams.get('status');

        if (status === 'approved') {
            localStorage.removeItem('pendingPaymentId');
        }
    }, [location]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="bg-dark-secondary p-8 rounded-xl shadow-lg animate-fade-in">
                <div className="text-6xl text-secondary mb-4">
                    ✓
                </div>
                <h1 className="text-4xl font-bold font-title text-text-primary mb-2">¡Pago Exitoso!</h1>
                <p className="text-text-secondary mb-6">Tu reserva ha sido confirmada. Recibirás un WhatsApp en breve.</p>
                <Link to="/" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;