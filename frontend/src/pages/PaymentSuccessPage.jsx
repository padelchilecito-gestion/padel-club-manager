import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const PaymentSuccessPage = () => {
    const [bookingDetails, setBookingDetails] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const pendingPaymentId = localStorage.getItem('pendingPaymentId');
        const queryParams = new URLSearchParams(location.search);
        const status = queryParams.get('status');

        if (pendingPaymentId && status === 'approved') {
            const fetchBookingDetails = async () => {
                try {
                    const res = await axios.get(`/api/payments/pending/${pendingPaymentId}`);
                    setBookingDetails(res.data);
                    localStorage.removeItem('pendingPaymentId'); // Limpiar para futuras reservas
                } catch (error) {
                    console.error("Error fetching booking details for WhatsApp:", error);
                }
            };
            fetchBookingDetails();
        }
    }, [location]);

    const sendWhatsAppMessage = () => {
        if (!bookingDetails) return;
        const { court, slots, user, date, adminWpp } = bookingDetails;
        const turnos = slots.map(s => s.time).sort((a,b) => a.localeCompare(b, undefined, { numeric: true })).join(', ');
        const message = `¡Reserva Confirmada y Pagada!\n\n*Cancha:* ${court.name}\n*Día:* ${format(new Date(date), 'eeee dd/MM/yyyy', {locale: es})}\n*Horarios:* ${turnos}hs\n\n*Cliente:* ${user.name}\n*Teléfono:* ${user.phone}`;
        const cleanPhone = adminWpp.replace(/[^0-9]/g, '');
        const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
            <div className="bg-dark-secondary p-8 rounded-xl shadow-lg">
                <div className="text-6xl text-secondary mb-4">
                    ✓
                </div>
                <h1 className="text-4xl font-bold font-title text-text-primary mb-2">¡Pago Exitoso!</h1>
                <p className="text-text-secondary mb-6">Tu reserva ha sido confirmada. ¡Te esperamos en la cancha!</p>
                {bookingDetails && (
                    <button onClick={sendWhatsAppMessage} className="bg-green-500 text-white font-bold py-3 px-6 rounded-lg hover:bg-green-600 transition mb-4">
                        Confirmar por WhatsApp
                    </button>
                )}
                <Link to="/" className="bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-primary-dark transition">
                    Volver al Inicio
                </Link>
            </div>
        </div>
    );
};

export default PaymentSuccessPage;