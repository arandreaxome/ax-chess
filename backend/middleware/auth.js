const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware d'authentification JWT
 * Vérifie le token et attache l'utilisateur à req.user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        message: 'Token d\'accès requis',
        code: 'NO_TOKEN'
      });
    }

    // Vérification du token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupération de l'utilisateur
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        message: 'Compte désactivé',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Token invalide',
        code: 'INVALID_TOKEN'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({ 
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Middleware optionnel d'authentification
 * N'échoue pas si pas de token, mais attache l'utilisateur si token valide
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password -refreshTokens');
    
    req.user = user && user.isActive ? user : null;
    next();

  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur
    req.user = null;
    next();
  }
};

/**
 * Middleware de vérification des rôles
 * @param {string[]} roles - Rôles autorisés
 */
const requireRoles = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentification requise',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Permissions insuffisantes',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware de vérification de propriété de ressource
 * Vérifie que l'utilisateur connecté est le propriétaire de la ressource
 */
const requireOwnership = (resourceIdParam = 'id', userIdField = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ 
          message: 'Authentification requise',
          code: 'AUTH_REQUIRED'
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      // Pour les ressources directement liées à l'utilisateur
      if (userIdField === 'user' && resourceId !== req.user._id.toString()) {
        return res.status(403).json({ 
          message: 'Accès non autorisé à cette ressource',
          code: 'ACCESS_DENIED'
        });
      }

      next();

    } catch (error) {
      console.error('Erreur de vérification de propriété:', error);
      return res.status(500).json({ 
        message: 'Erreur interne du serveur',
        code: 'INTERNAL_ERROR'
      });
    }
  };
};

/**
 * Génère un token JWT
 * @param {Object} payload - Données à encoder dans le token
 * @param {string} secret - Clé secrète
 * @param {string} expiresIn - Durée d'expiration
 */
const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

/**
 * Génère une paire de tokens (access + refresh)
 * @param {string} userId - ID de l'utilisateur
 */
const generateTokenPair = (userId) => {
  const accessToken = generateToken(
    { userId },
    process.env.JWT_SECRET,
    process.env.JWT_EXPIRE || '15m'
  );

  const refreshToken = generateToken(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    process.env.JWT_REFRESH_EXPIRE || '7d'
  );

  return { accessToken, refreshToken };
};

/**
 * Vérifie un refresh token
 * @param {string} token - Refresh token à vérifier
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRoles,
  requireOwnership,
  generateToken,
  generateTokenPair,
  verifyRefreshToken
};