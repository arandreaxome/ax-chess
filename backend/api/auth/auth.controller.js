const { validationResult } = require('express-validator');
const User = require('../../models/User');
const { generateTokenPair, verifyRefreshToken } = require('../../middleware/auth');

/**
 * @desc    Inscription d'un nouvel utilisateur
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    // Vérification des erreurs de validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données d\'inscription invalides',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'nom d\'utilisateur';
      return res.status(409).json({
        message: `Ce ${field} est déjà utilisé`,
        code: 'USER_EXISTS'
      });
    }

    // Créer le nouvel utilisateur
    const user = new User({
      username,
      email,
      password
    });

    await user.save();

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Sauvegarder le refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    // Réponse sans le mot de passe
    const userResponse = user.toSafeJSON();

    res.status(201).json({
      message: 'Inscription réussie',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Connexion d'un utilisateur
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données de connexion invalides',
        errors: errors.array()
      });
    }

    const { identifier, password } = req.body;

    // Chercher l'utilisateur par email ou nom d'utilisateur
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier }
      ]
    });

    if (!user) {
      return res.status(401).json({
        message: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        message: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        message: 'Compte désactivé',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Générer les tokens
    const { accessToken, refreshToken } = generateTokenPair(user._id);

    // Sauvegarder le refresh token
    user.refreshTokens.push({ token: refreshToken });
    user.lastLogin = new Date();
    await user.save();

    // Réponse
    const userResponse = user.toSafeJSON();

    res.json({
      message: 'Connexion réussie',
      user: userResponse,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Renouvellement du token d'accès
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({
        message: 'Refresh token requis',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    // Vérifier le refresh token
    const decoded = verifyRefreshToken(token);
    
    // Chercher l'utilisateur
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: 'Utilisateur non trouvé ou désactivé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Vérifier que le token existe dans la base
    const tokenExists = user.refreshTokens.some(rt => rt.token === token);
    if (!tokenExists) {
      return res.status(401).json({
        message: 'Refresh token invalide',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    // Générer de nouveaux tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokenPair(user._id);

    // Remplacer l'ancien refresh token
    user.refreshTokens = user.refreshTokens.filter(rt => rt.token !== token);
    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    res.json({
      message: 'Tokens renouvelés',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Refresh token expiré',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    console.error('Erreur lors du renouvellement:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Déconnexion (invalide le refresh token)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (token) {
      // Supprimer le refresh token spécifique
      req.user.refreshTokens = req.user.refreshTokens.filter(rt => rt.token !== token);
      await req.user.save();
    }

    res.json({
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Déconnexion de tous les appareils
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAll = async (req, res) => {
  try {
    // Supprimer tous les refresh tokens
    req.user.refreshTokens = [];
    await req.user.save();

    res.json({
      message: 'Déconnexion de tous les appareils réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion globale:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Récupération du profil utilisateur connecté
 * @route   GET /api/auth/me
 * @access  Private
 */
const getProfile = async (req, res) => {
  try {
    res.json({
      user: req.user.toSafeJSON()
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Mise à jour du profil utilisateur
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données de profil invalides',
        errors: errors.array()
      });
    }

    const { username, email, profile } = req.body;
    const user = req.user;

    // Vérifier l'unicité du nom d'utilisateur et email
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(409).json({
          message: 'Ce nom d\'utilisateur est déjà utilisé',
          code: 'USERNAME_EXISTS'
        });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          message: 'Cet email est déjà utilisé',
          code: 'EMAIL_EXISTS'
        });
      }
      user.email = email;
    }

    // Mise à jour du profil
    if (profile) {
      user.profile = { ...user.profile, ...profile };
    }

    await user.save();

    res.json({
      message: 'Profil mis à jour avec succès',
      user: user.toSafeJSON()
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Changement de mot de passe
 * @route   PUT /api/auth/password
 * @access  Private
 */
const changePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données de mot de passe invalides',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const user = req.user;

    // Vérifier le mot de passe actuel
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        message: 'Mot de passe actuel incorrect',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    // Mettre à jour le mot de passe
    user.password = newPassword;
    await user.save();

    // Déconnecter tous les autres appareils
    user.refreshTokens = [];
    await user.save();

    res.json({
      message: 'Mot de passe changé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors du changement de mot de passe:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Demande de réinitialisation de mot de passe
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Email invalide',
        errors: errors.array()
      });
    }

    // Pour la sécurité, on retourne toujours le même message
    res.json({
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé'
    });

    // TODO: Implémenter l'envoi d'email de réinitialisation
    
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Réinitialisation de mot de passe
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données de réinitialisation invalides',
        errors: errors.array()
      });
    }

    // TODO: Implémenter la réinitialisation avec token
    
    res.json({
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Vérification d'email
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Token de vérification invalide',
        errors: errors.array()
      });
    }

    // TODO: Implémenter la vérification d'email
    
    res.json({
      message: 'Email vérifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification d\'email:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Renvoi de l'email de vérification
 * @route   POST /api/auth/resend-verification
 * @access  Private
 */
const resendVerification = async (req, res) => {
  try {
    if (req.user.isVerified) {
      return res.status(400).json({
        message: 'Email déjà vérifié',
        code: 'ALREADY_VERIFIED'
      });
    }

    // TODO: Implémenter le renvoi d'email de vérification
    
    res.json({
      message: 'Email de vérification renvoyé'
    });

  } catch (error) {
    console.error('Erreur lors du renvoi de vérification:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  logoutAll,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification
};