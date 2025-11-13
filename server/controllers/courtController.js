const Court = require('../models/Court');
const { logActivity } = require('../utils/logActivity');

// @desc    Create a new court
// @route   POST /api/courts
// @access  Admin
const createCourt = async (req, res) => {
  // --- CAMPOS NUEVOS AÑADIDOS ---
  const { name, courtType, pricePerHour, pricePer90Min, pricePer120Min, isActive } = req.body;

  try {
    const court = new Court({
      name,
      courtType,
      pricePerHour,
      pricePer90Min: pricePer90Min || null, // <-- AÑADIDO
      pricePer120Min: pricePer120Min || null, // <-- AÑADIDO
      isActive,
    });

    const createdCourt = await court.save();
    await logActivity(req.user, 'COURT_CREATED', `Court '${createdCourt.name}' was created.`);
    res.status(201).json(createdCourt);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A court with this name already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get all courts
// @route   GET /api/courts
// @access  Public
const getAllCourts = async (req, res) => {
  try {
    const courts = await Court.find({}).sort({ name: 1 });
    res.json(courts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get a single court by ID
// @route   GET /api/courts/:id
// @access  Public
const getCourtById = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);

    if (court) {
      res.json(court);
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a court
// @route   PUT /api/courts/:id
// @access  Admin
const updateCourt = async (req, res) => {
  // --- CAMPOS NUEVOS AÑADIDOS ---
  const { name, courtType, pricePerHour, pricePer90Min, pricePer120Min, isActive } = req.body;

  try {
    const court = await Court.findById(req.params.id);

    if (court) {
      court.name = name || court.name;
      court.courtType = courtType || court.courtType;
      court.pricePerHour = pricePerHour !== undefined ? pricePerHour : court.pricePerHour;
      
      // --- LÓGICA DE ACTUALIZACIÓN AÑADIDA ---
      court.pricePer90Min = pricePer90Min !== undefined ? pricePer90Min : court.pricePer90Min;
      court.pricePer120Min = pricePer120Min !== undefined ? pricePer120Min : court.pricePer120Min;
      // ------------------------------------

      court.isActive = isActive !== undefined ? isActive : court.isActive;

      const updatedCourt = await court.save();
      await logActivity(req.user, 'COURT_UPDATED', `Court '${updatedCourt.name}' was updated.`);
      res.json(updatedCourt);
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'A court with this name already exists.' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a court
// @route   DELETE /api/courts/:id
// @access  Admin
const deleteCourt = async (req, res) => {
  try {
    const court = await Court.findById(req.params.id);

    if (court) {
      const courtName = court.name;
      // await court.remove(); // .remove() está obsoleto
      await Court.deleteOne({ _id: req.params.id }); // Usar deleteOne
      await logActivity(req.user, 'COURT_DELETED', `Court '${courtName}' was deleted.`);
      res.json({ message: 'Court removed' });
    } else {
      res.status(404).json({ message: 'Court not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createCourt,
  getAllCourts,
  getCourtById,
  updateCourt,
  deleteCourt,
};
