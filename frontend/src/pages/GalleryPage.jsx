import React, { useEffect, useState } from 'react';
import { photoService } from '../services/photoService';

const GalleryPage = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPhotos = async () => {
      try {
        setLoading(true);
        const data = await photoService.getAllPhotos();
        setPhotos(data);
      } catch (err) {
        setError('No se pudieron cargar las fotos de la galería.');
      } finally {
        setLoading(false);
      }
    };
    fetchPhotos();
  }, []);

  if (loading) return <div className="text-center text-text-primary mt-8">Cargando galería...</div>;
  if (error) return <div className="text-center text-danger mt-8">{error}</div>;
  if (photos.length === 0) return <div className="text-center text-text-secondary mt-8">No hay fotos en la galería aún.</div>;

  return (
    <div className="container mx-auto p-4 md:p-8 bg-dark-primary min-h-screen text-text-primary">
      <h1 className="text-3xl font-bold text-center text-primary mb-8">Nuestras Instalaciones</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {photos.map((photo) => (
          <div key={photo._id} className="bg-dark-secondary rounded-lg shadow-lg overflow-hidden transform hover:scale-105 transition-transform duration-300">
            <img src={photo.url} alt={photo.description || 'Padel Club'} className="w-full h-48 object-cover" />
            {photo.description && (
              <p className="p-4 text-sm text-text-secondary">{photo.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GalleryPage;