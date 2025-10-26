import React, { useState, useEffect } from 'react';
// --- LÍNEA CORREGIDA ---
// Importamos las funciones específicas que usa esta página
import { getCourts, deleteCourt } from '../../services/courtService';
// --- FIN DE CORRECCIÓN ---
import CourtFormModal from '../../components/admin/CourtFormModal';
import { FullPageLoading, ErrorMessage } from '../../components/ui/Feedback';
// Usamos Lucide para consistencia con el resto del admin
import { Box, Plus, Pencil, Trash2 } from 'lucide-react';

const CourtsPage = () => {
  const [courts, setCourts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      // --- LÍNEA CORREGIDA ---
      const data = await getCourts(); // Se llama a la función directamente
      setCourts(data);
    } catch (err) {
      setError(err.message || 'Error al cargar las canchas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (court = null) => {
    setSelectedCourt(court);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourt(null);
  };

  const handleSuccess = () => {
    handleCloseModal();
    fetchCourts(); // Refrescar la lista de canchas
  };

  const handleDeleteCourt = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta cancha? Esta acción no se puede deshacer.')) {
      try {
        setError(null);
        // --- LÍNEA CORREGIDA ---
        await deleteCourt(id); // Se llama a la función directamente
        fetchCourts(); // Refrescar la lista
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Error al eliminar la cancha');
      }
    }
  };

  if (isLoading && courts.length === 0) {
    return <FullPageLoading text="Cargando canchas..." />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary flex items-center mb-4 md:mb-0">
          <Box className="mr-3" size={30} />
          Gestión de Canchas
        </h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center px-4 py-2 bg-indigo-dark text-white rounded-lg font-semibold shadow-md hover:bg-indigo-light transition-colors"
        >
          <Plus className="mr-2" size={20} />
          Nueva Cancha
        </button>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      <div className="bg-dark-secondary shadow-2xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-text-secondary">
            <thead className="text-xs text-text-primary uppercase bg-dark-primary/50">
              <tr>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4 hidden sm:table-cell">Tipo</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {courts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-6 text-center text-gray-400">
                    No hay canchas creadas.
                  </td>
                </tr>
              ) : (
                courts.map((court) => (
                  <tr key={court._id} className="hover:bg-dark-primary/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-text-primary">{court.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">{court.type === 'classic' ? 'Clásica' : 'Panorámica'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">${court.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          court.status === 'available' ? 'bg-green-dark text-white' : 'bg-yellow-dark text-dark-primary'
                        }`}
                      >
                        {court.status === 'available' ? 'Disponible' : 'Mantenimiento'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <button
                        onClick={() => handleOpenModal(court)}
                        className="text-indigo-light hover:text-indigo-dark transition-colors mr-4"
                        title="Editar"
                      >
                        <Pencil size={20} />
                      </button>
                      <button
                        onClick={() => handleDeleteCourt(court._id)}
                        className="text-danger hover:text-red-400 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <CourtFormModal
          court={selectedCourt}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default CourtsPage;
