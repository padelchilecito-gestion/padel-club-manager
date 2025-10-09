const Photo = require('../models/Photo');
const { cloudinary } = require('../config/cloudinaryConfig');
const { logActivity } = require('../utils/logActivity');

exports.getAllPhotos = async (req, res) => {
  try {
    const photos = await Photo.find().sort({ order: 1, createdAt: 1 });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se ha subido ningún archivo.' });
    }

    const newPhoto = new Photo({
      url: req.file.path,
      publicId: req.file.filename,
      description: req.body.description || '',
      order: req.body.order || 0,
      uploadedBy: req.user._id,
    });

    const savedPhoto = await newPhoto.save();
    await logActivity(req.user, 'PHOTO_UPLOADED', `Photo ${savedPhoto.publicId} uploaded.`);
    res.status(201).json(savedPhoto);
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.updatePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, order } = req.body;

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: 'Foto no encontrada.' });
    }

    photo.description = description !== undefined ? description : photo.description;
    photo.order = order !== undefined ? order : photo.order;

    const updatedPhoto = await photo.save();
    await logActivity(req.user, 'PHOTO_UPDATED', `Photo ${updatedPhoto.publicId} updated.`);
    res.json(updatedPhoto);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await Photo.findById(id);

    if (!photo) {
      return res.status(404).json({ message: 'Foto no encontrada.' });
    }

    await cloudinary.uploader.destroy(photo.publicId);
    await Photo.findByIdAndDelete(id);

    await logActivity(req.user, 'PHOTO_DELETED', `Photo ${photo.publicId} deleted.`);
    res.json({ message: 'Foto eliminada correctamente.' });
  } catch (err) {
    console.error("Error deleting photo:", err);
    res.status(500).json({ message: err.message });
  }
};