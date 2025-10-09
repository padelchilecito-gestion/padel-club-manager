import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { photoService } from '../../services/photoService';
import { PlusCircleIcon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import ConfirmationModal from '../../components/common/ConfirmationModal';

const GalleryAdminPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [newDescription, setNewDescription] = useState('');
  const [newOrder, setNewOrder] = useState(0);
  const [editingPhoto, setEditingPhoto] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      const data = await photoService.getAllPhotos();
      setPhotos(data);
    } catch (err) {
      setError('No se pudieron cargar las fotos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, []);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error('Por favor, selecciona un archivo para subir.');
      return;
    }
    setLoading(true);
    try {
      await photoService.uploadPhoto(selectedFile, newDescription, newOrder);
      toast.success('Foto subida exitosamente!');
      setSelectedFile(null);
      setNewDescription('');
      setNewOrder(0);
      fetchPhotos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al subir la foto.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (photo) => {
    setPhotoToDelete(photo);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (photoToDelete) {
      setLoading(true);
      try {
        await photoService.deletePhoto(photoToDelete._id);
        toast.success('Foto eliminada exitosamente!');
        fetchPhotos();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Error al eliminar la foto.');
      } finally {
        setLoading(false);
        setPhotoToDelete(null);
        setShowConfirmModal(false);
      }
    }
  };

  const handleEditClick = (photo) => {
    setEditingPhoto({ ...photo });
  };

  const handleUpdatePhoto = async (e) => {
    e.preventDefault();
    if (!editingPhoto) return;

    setLoading(true);
    try {
      await photoService.updatePhoto(editingPhoto._id, editingPhoto.description, editingPhoto.order);
      toast.success('Foto actualizada exitosamente!');
      setEditingPhoto(null);
      fetchPhotos();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al actualizar la foto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 bg-dark-secondary rounded-lg shadow-lg">
      <h2 className="text-3xl font-bold text-primary mb-6">Administrar Galería de Fotos</h2>

      {error && <p className="text-danger mb-4">{error}</p>}

      <form onSubmit={handleUpload} className="bg-dark-primary p-6 rounded-lg mb-8">
        <h3 className="text-xl font-semibold text-text-primary mb-4">Subir Nueva Foto</h3>
        <div className="mb-4">
          <label htmlFor="photoFile" className="block text-sm font-medium text-text-secondary mb-1">Archivo de Imagen</label>
          <input type="file" id="photoFile" onChange={handleFileChange} required className="w-full text-text-primary bg-dark-secondary border border-gray-600 rounded-md p-2" />
        </div>
        <div className="mb-4">
          <label htmlFor="photoDescription" className="block text-sm font-medium text-text-secondary mb-1">Descripción (opcional)</label>
          <input type="text" id="photoDescription" value={newDescription} onChange={(e) => setNewDescription(e.target.value)} className="w-full bg-dark-secondary p-2 rounded-md border border-gray-600" />
        </div>
        <div className="mb-4">
          <label htmlFor="photoOrder" className="block text-sm font-medium text-text-secondary mb-1">Orden (número, opcional)</label>
          <input type="number" id="photoOrder" value={newOrder} onChange={(e) => setNewOrder(parseInt(e.target.value))} className="w-full bg-dark-secondary p-2 rounded-md border border-gray-600" />
        </div>
        <button type="submit" className="bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-md transition-colors disabled:opacity-50" disabled={loading}>
          {loading ? 'Subiendo...' : 'Subir Foto'}
        </button>
      </form>

      <h3 className="text-xl font-semibold text-text-primary mb-4">Fotos Existentes</h3>
      {loading && <p className="text-text-secondary">Cargando fotos...</p>}
      {!loading && photos.length === 0 && <p className="text-text-secondary">No hay fotos en la galería.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <div key={photo._id} className="bg-dark-primary rounded-lg shadow-md overflow-hidden relative">
            <img src={photo.url} alt={photo.description || 'Padel Club'} className="w-full h-48 object-cover" />
            <div className="p-3">
              {editingPhoto?._id === photo._id ? (
                <form onSubmit={handleUpdatePhoto}>
                  <textarea
                    value={editingPhoto.description}
                    onChange={(e) => setEditingPhoto({...editingPhoto, description: e.target.value})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md mb-2"
                  />
                  <input
                    type="number"
                    value={editingPhoto.order}
                    onChange={(e) => setEditingPhoto({...editingPhoto, order: parseInt(e.target.value)})}
                    className="w-full bg-gray-700 text-white p-2 rounded-md mb-2"
                  />
                  <div className="flex justify-end gap-2">
                    <button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm">Guardar</button>
                    <button type="button" onClick={() => setEditingPhoto(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md text-sm">Cancelar</button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="text-text-primary text-sm mb-1">{photo.description || 'Sin descripción'}</p>
                  <p className="text-text-secondary text-xs">Orden: {photo.order}</p>
                  <div className="absolute top-2 right-2 flex space-x-2">
                    <button onClick={() => handleEditClick(photo)} className="text-blue-400 hover:text-blue-300">
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDeleteClick(photo)} className="text-danger hover:text-red-400">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmationModal
        show={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message={`¿Estás seguro de que quieres eliminar la foto "${photoToDelete?.description || photoToDelete?.publicId}"? Esta acción es irreversible.`}
      />
    </div>
  );
};

export default GalleryAdminPage;