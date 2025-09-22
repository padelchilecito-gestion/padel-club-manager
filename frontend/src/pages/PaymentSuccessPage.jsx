import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccessPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="bg-dark-secondary p-8 rounded-xl shadow-lg">
                <div className="text-6xl text-secondary mb-4">
                    ✓
                </div>
                <h1 className="text-4xl font-bold font-title text-text-primary mb-2">¡Pago Exitoso!</h1>
                <p className="text-text-secondary mb-6">Tu reserva ha sido confirmada. ¡Te esperamos en la cancha!</p>
                <Link to="/" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;