const jwt = require('jsonwebtoken');
const User = require('../models/User');
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

// --- AÑADIDO ---
// Esta es la función que faltaba.
// Acepta un array de roles (ej. ['Admin', 'Operator'])
// y devuelve un middleware que comprueba si el usuario (req.user) tiene uno de esos roles.
const authorize = (roles) => {
  return (req, res, next) => {
    // Se asume que 'protect' ya se ejecutó y adjuntó 'req.user'
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}` });
    }
    next();
  };
};

// --- MODIFICADO ---
// Añadimos 'authorize' al objeto que exportamos
module.exports = { protect, admin, authorize };
