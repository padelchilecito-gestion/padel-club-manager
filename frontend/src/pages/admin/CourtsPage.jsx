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
    <div className="container mx-auto p-6 text-white">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold flex items-center">
          <Box className="mr-3" size={30} />
          Gestión de Canchas
        </h1>
        <button
          onClick={() => handleOpenModal(null)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold shadow-md hover:bg-indigo-700 transition duration-300"
        >
          <Plus className="mr-2" size={20} />
          Nueva Cancha
        </button>
      </div>

      {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

      <div className="bg-gray-800 shadow-lg rounded-lg overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-750">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Tipo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {courts.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-400">
                  No hay canchas creadas.
                </td>
              </tr>
            ) : (
              courts.map((court) => (
                <tr key={court._id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{court.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{court.type === 'classic' ? 'Clásica' : 'Panorámica'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${court.price}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        court.status === 'available' ? 'bg-green-800 text-green-100' : 'bg-yellow-800 text-yellow-100'
                      }`}
                    >
                      {court.status === 'available' ? 'Disponible' : 'Mantenimiento'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleOpenModal(court)}
                      className="text-indigo-400 hover:text-indigo-300 mr-4"
                      title="Editar"
                    >
                      <Pencil size={20} />
                    </button>
                    <button
                      onClick={() => handleDeleteCourt(court._id)}
                      className="text-red-500 hover:text-red-400"
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
