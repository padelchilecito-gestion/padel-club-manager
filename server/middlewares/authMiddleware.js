// server/middlewares/authMiddleware.js (CORREGIDO)
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  // --- INICIO DE LA CORRECCIÓN ---
  // 1. Intentar leer el token desde la cookie httpOnly
  token = req.cookies.token;

  // 2. Fallback: Si no está en cookies, buscar en el header (método antiguo)
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  // --- FIN DE LA CORRECCIÓN ---

  if (token) {
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        // Si el usuario fue eliminado pero el token aún es válido
        res.status(401);
        throw new Error('Usuario no encontrado.');
      }

      next();
    } catch (error) {
      console.error('Error de autenticación:', error.message);
      res.status(401);
      // Distinguir por qué falló
      if (error.name === 'JsonWebTokenError') {
        throw new Error('No autorizado, token inválido.');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('No autorizado, token expirado.');
      }
      throw new Error('No autorizado, token fallido.');
    }
  } else {
    // Este es el error que estabas viendo en el navegador
    res.status(401);
    throw new Error('No autorizado, no hay token');
  }
});

// El middleware de Admin está bien, solo verifica el rol.
const admin = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin')) {
    next();
  } else {
    res.status(403);
    throw new Error('No autorizado como Administrador');
  }
};

// Middleware de Admin/Operador
const adminOrOperator = (req, res, next) => {
  if (req.user && (req.user.role === 'Admin' || req.user.role === 'Operator')) {
    next();
  } else {
    res.status(4G3); // Corregido de 4G3 a 403
    throw new Error('No autorizado, se requiere rol de Admin u Operador');
  }
};

module.exports = { protect, admin, adminOrOperator };
