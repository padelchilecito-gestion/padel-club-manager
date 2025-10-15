import React, { useState, useEffect } from 'react';
import { courtService } from '../services/courtService';
import { settingService } from '../services/settingService';
import TimeSlotFinder from '../components/TimeSlotFinder';
import BookingModal from '../components/BookingModal';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
    const { user } = useAuth();
    const [courts, setCourts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);

    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [fetchedCourts, fetchedSettings] = await Promise.all([
                    courtService.getAllCourts(),
                    settingService.getSettings()
                ]);

                // --- INICIO DE LA CORRECCIÓN: VALIDACIÓN DE DATOS ---
                // Validamos que la configuración esencial exista. Si no, forzamos un error.
                if (!fetchedSettings || !fetchedSettings.minTime || !fetchedSettings.maxTime || !fetchedSettings.slotDuration) {
                    throw new Error("La configuración del club no está completa. Por favor, contacta al administrador.");
                }
                // --- FIN DE LA CORRECCIÓN ---

                const enabledCourts = fetchedCourts.filter(c => c.isEnabled);

                setCourts(enabledCourts);
                setSettings(fetchedSettings);

            } catch (err) {
                console.error("Error fetching initial data:", err);
                // Ahora este bloque SÍ se ejecutará si la configuración está incompleta.
                setError(err.message || "No se pudieron cargar los horarios. Por favor, intenta de nuevo más tarde.");
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, []);

    const handleSelectSlot = (slot) => {
        setSelectedSlot(slot);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedSlot(null);
    };

    if (loading) {
        return <div className="text-center p-8">Cargando disponibilidad...</div>;
    }

    if (error) {
        return <div className="text-center p-8 text-red-500 bg-red-100 rounded-lg">{error}</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-4xl font-bold text-center my-6">Reservar una Cancha</h1>

            {courts.length > 0 && settings ? (
                <TimeSlotFinder
                    courts={courts}
                    settings={settings}
                    onSelectSlot={handleSelectSlot}
                />
            ) : (
                <div className="text-center p-8 text-gray-500 bg-gray-100 rounded-lg">
                    No hay canchas habilitadas para reservar en este momento.
                </div>
            )}

            {isModalOpen && selectedSlot && (
                <BookingModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    bookingDetails={selectedSlot}
                    user={user}
                />
            )}
        </div>
    );
};

export default HomePage;