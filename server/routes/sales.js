// server/routes/sales.js (CORREGIDO)
const express = require('express');
const router = express.Router();
const {
  createSale,
  getSaleById,
  getSales,
  updateSaleStatus, // <-- CORREGIDO: Faltaba importar
  deleteSale,       // <-- CORREGIDO: Faltaba importar
} = require('../controllers/saleController');
const { protect, adminOrOperator } = require('../middlewares/authMiddleware'); // <-- CORREGIDO

// Aplicamos middlewares
router.use(protect);
router.use(adminOrOperator); // <-- CORREGIDO

router.route('/')
  .get(getSales)
  .post(createSale);

router.route('/:id')
  .get(getSaleById)
  .put(updateSaleStatus)  // <-- CORREGIDO: Faltaba esta ruta
  .delete(deleteSale);    // <-- CORREGIDO: Faltaba esta ruta

module.exports = router;
