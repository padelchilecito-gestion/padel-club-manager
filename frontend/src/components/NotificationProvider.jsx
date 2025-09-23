import React, { useState, useEffect, createContext, useContext } from 'react';
import { io } from 'socket.io-client';

// --- CAMBIO CLAVE ---
// La URL para los sockets será la misma que la del frontend (se omite para conectar al mismo host).
// Añadimos la opción 'path' para que coincida con la configuración del servidor en Vercel.
export const socket = io({
    path: "/api/socket.io/", // Esta línea es crucial para Vercel
    transports: ['websocket', 'polling']
});

const NotificationContext = createContext();

export const useNotifier = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    // ... (el resto del componente no necesita cambios)
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const handleBookingUpdate = (data) => {
            const booking = data.booking || data;
            
            addNotification({
                title: 'Actualización de Turno',
                message: `El turno de las ${new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}hs para ${booking.user.name} ha sido actualizado.`
            });
        };

        const handleBookingDeleted = (booking) => {
            addNotification({
                title: 'Turno Eliminado',
                message: `La reserva de las ${new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}hs ha sido eliminada. El turno está libre.`
            });
        };

        socket.on('booking_update', handleBookingUpdate);
        socket.on('booking_deleted', handleBookingDeleted);

        return () => {
            socket.off('booking_update', handleBookingUpdate);
            socket.off('booking_deleted', handleBookingDeleted);
        };
    }, []);

    const addNotification = (notification) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { ...notification, id }]);

        setTimeout(() => {
            removeNotification(id);
        }, 5000);
    };

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-3">
                {notifications.map(n => (
                    <div key={n.id} className="bg-dark-secondary border-l-4 border-secondary rounded-lg shadow-lg p-4 animate-fade-in flex items-start gap-4">
                        <div className="flex-shrink-0 text-secondary text-xl">
                            <i className="fas fa-bell"></i>
                        </div>
                        <div className="flex-grow">
                            <h4 className="font-bold text-text-primary">{n.title}</h4>
                            <p className="text-sm text-text-secondary">{n.message}</p>
                        </div>
                        <button onClick={() => removeNotification(n.id)} className="text-text-secondary hover:text-white">&times;</button>
                    </div>
                ))}
            </div>
        </NotificationContext.Provider>
    );
};