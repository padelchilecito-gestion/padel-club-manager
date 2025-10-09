const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const Setting = require('../models/Setting');

const getCloudinaryConfig = async () => {
  const cloudNameSetting = await Setting.findOne({ key: 'CLOUDINARY_CLOUD_NAME' });
  const apiKeySetting = await Setting.findOne({ key: 'CLOUDINARY_API_KEY' });
  const apiSecretSetting = await Setting.findOne({ key: 'CLOUDINARY_API_SECRET' });

  if (cloudNameSetting && apiKeySetting && apiSecretSetting) {
    return {
      cloud_name: cloudNameSetting.value,
      api_key: apiKeySetting.value,
      api_secret: apiSecretSetting.value
    };
  } else {
    return {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    };
  }
};

const configureCloudinary = async () => {
  const config = await getCloudinaryConfig();
  if (config.cloud_name && config.api_key && config.api_secret) {
    cloudinary.config(config);
  } else {
    console.error("Cloudinary credentials are not set in DB or .env");
  }
};

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'padel-club-gallery',
    allowed_formats: ['jpeg', 'png', 'jpg'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload, configureCloudinary };