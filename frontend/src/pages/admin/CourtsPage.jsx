import React, { useState, useEffect } from 'react';
import { courtService } from '../../services/courtService';
import CourtFormModal from '../../components/admin/CourtFormModal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/solid';

const CourtsPage = () => {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCourt, setSelectedCourt] = useState(null);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const data = await courtService.getAllCourts();
      setCourts(data);
    } catch (err) {
      setError('No se pudieron cargar las canchas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const handleOpenModal = (court = null) => {
    setSelectedCourt(court);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCourt(null);
  };

  const handleSuccess = () => {
    fetchCourts(); // Refetch courts after a successful operation
    handleCloseModal();
  };

  const handleDelete = async (courtId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta cancha?')) {
      try {
        await courtService.deleteCourt(courtId);
        alert('Cancha eliminada con éxito.');
        fetchCourts(); // Refetch
      } catch (err) {
        alert('Error al eliminar la cancha.');
      }
    }
  };
  
  if (loading) return <div className="text-center p-8">Cargando canchas...</div>;
  if (error) return <div className="text-center p-8 text-danger">{error}</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-text-primary">Gestión de Canchas</h1>
        <button
          onClick={() => handleOpenModal()}
          className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors"
        >
          Añadir Cancha
        </button>
      </div>

      <div className="bg-dark-secondary shadow-lg rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left text-text-secondary">
          <thead className="text-xs text-text-primary uppercase bg-dark-primary">
            <tr>
              <th scope="col" className="px-6 py-3">Nombre</th>
              <th scope="col" className="px-6 py-3">Tipo</th>
              <th scope="col" className="px-6 py-3">Precio/Hora</th>
              <th scope="col" className="px-6 py-3">Estado</th>
              <th scope="col" className="px-6 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courts.map((court) => (
              <tr key={court._id} className="border-b border-gray-700 hover:bg-dark-primary">
                <td className="px-6 py-4 font-medium text-text-primary">{court.name}</td>
                <td className="px-6 py-4">{court.courtType}</td>
                <td className="px-6 py-4">${court.pricePerHour.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      court.isActive ? 'bg-secondary text-dark-primary' : 'bg-gray-500 text-white'
                  }`}>
                      {court.isActive ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-6 py-4 flex items-center gap-4">
                  <button onClick={() => handleOpenModal(court)} className="text-blue-400 hover:text-blue-300" title="Editar Cancha">
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(court._id)} className="text-danger hover:text-red-400" title="Eliminar Cancha">
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
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
