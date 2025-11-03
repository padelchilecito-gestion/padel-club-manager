// server/routes/sales.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSaleById,
  getSales,
  updateSaleStatus, // <-- Esta función faltaba en la importación original
  deleteSale,       // <-- Esta función faltaba en la importación original
} = require('../controllers/saleController');

// --- INICIO DE LA CORRECCIÓN ---
// Importamos 'adminOrOperator' en lugar de 'authorize'
const { protect, adminOrOperator } = require('../middlewares/authMiddleware');

// Aplicamos los middlewares para todas las rutas de ventas
router.use(protect);
router.use(adminOrOperator); // <-- Reemplaza 'authorize(['Admin', 'Operator'])'
// --- FIN DE LA CORRECCIÓN ---

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:id')
  .get(getSaleById)
  // Estas rutas faltaban en tu archivo original
  .put(updateSaleStatus) 
  .delete(deleteSale);

module.exports = router;
