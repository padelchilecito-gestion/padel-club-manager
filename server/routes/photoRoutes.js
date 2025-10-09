const express = require('express');
const router = express.Router();
const photoController = require('../controllers/photoController');
const { protect, authorize } = require('../middlewares/authMiddleware');
const { upload } = require('../config/cloudinaryConfig');

router.get('/', photoController.getAllPhotos);
router.post('/', protect, authorize(['Admin']), upload.single('photo'), photoController.uploadPhoto);
router.put('/:id', protect, authorize(['Admin']), photoController.updatePhoto);
router.delete('/:id', protect, authorize(['Admin']), photoController.deletePhoto);

module.exports = router;