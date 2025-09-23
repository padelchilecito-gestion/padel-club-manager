import React, { useState, useEffect, createContext, useContext } from 'react';
import io from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
export const socket = io(SOCKET_URL);

// 1. Creamos un contexto para las notificaciones
const NotificationContext = createContext();

// Hook para usar las notificaciones fácilmente en otros componentes
export const useNotifier = () => useContext(NotificationContext);

// 2. Creamos el componente Provider que contendrá toda la lógica
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        // Escuchador para nuevas reservas o actualizaciones
        const handleBookingUpdate = (data) => {
            // El backend a veces envía el objeto booking directamente, y otras veces anidado.
            const booking = data.booking || data;
            
            addNotification({
                title: 'Actualización de Turno',
                message: `El turno de las ${new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}hs para ${booking.user.name} ha sido actualizado.`
            });
        };

        // Escuchador para reservas eliminadas
        const handleBookingDeleted = (booking) => {
            addNotification({
                title: 'Turno Eliminado',
                message: `La reserva de las ${new Date(booking.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}hs ha sido eliminada. El turno está libre.`
            });
        };

        socket.on('booking_update', handleBookingUpdate);
        socket.on('booking_deleted', handleBookingDeleted);

        // Limpiamos los listeners cuando el componente se desmonta
        return () => {
            socket.off('booking_update', handleBookingUpdate);
            socket.off('booking_deleted', handleBookingDeleted);
        };
    }, []);

    const addNotification = (notification) => {
        const id = Date.now();
        setNotifications(prev => [...prev, { ...notification, id }]);

        // Hacemos que la notificación desaparezca después de 5 segundos
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
            {/* Contenedor que renderizará las notificaciones en pantalla */}
            <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm space-y-3">
                {notifications.map(n => (
                    <div key={n.id} className="bg-dark-secondary border-l-4 border-secondary rounded-lg shadow-lg p-4 animate-fade-in flex items-start gap-4">
                        <div className="flex-shrink-0 text-secondary text-xl">
                            <i className="fas fa-bell"></i> {/* Asegúrate de tener FontAwesome o cambia por un SVG */}
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