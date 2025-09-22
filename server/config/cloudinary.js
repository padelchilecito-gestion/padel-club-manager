const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Tu CLOUDINARY_URL debe estar en tu archivo .env
// Cloudinary lo detectará automáticamente.
// Ejemplo: CLOUDINARY_URL=cloudinary://API-Key:API-Secret@cloud-name

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'padel-club-products', // Carpeta en Cloudinary para las fotos
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

const upload = multer({ storage: storage });

module.exports = upload;