const express = require('express');
const { body } = require('express-validator');
const authController = require('./auth.controller');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Validation pour l'inscription
const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 20 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format d\'email invalide'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

// Validation pour la connexion
const loginValidation = [
  body('identifier')
    .notEmpty()
    .withMessage('Nom d\'utilisateur ou email requis'),
  
  body('password')
    .notEmpty()
    .withMessage('Mot de passe requis')
];

// Validation pour le changement de mot de passe
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Mot de passe actuel requis'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
];

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion d'un utilisateur
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Renouvellement du token d'accès
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Déconnexion (invalide le refresh token)
 * @access  Private
 */
router.post('/logout', authenticateToken, authController.logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Déconnexion de tous les appareils
 * @access  Private
 */
router.post('/logout-all', authenticateToken, authController.logoutAll);

/**
 * @route   GET /api/auth/me
 * @desc    Récupération du profil utilisateur connecté
 * @access  Private
 */
router.get('/me', authenticateToken, authController.getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mise à jour du profil utilisateur
 * @access  Private
 */
router.put('/profile', authenticateToken, [
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .withMessage('Le nom d\'utilisateur doit contenir entre 3 et 20 caractères')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores'),
  
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Format d\'email invalide'),
  
  body('profile.bio')
    .optional()
    .isLength({ max: 200 })
    .withMessage('La bio ne peut pas dépasser 200 caractères'),
  
  body('profile.country')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Le pays ne peut pas dépasser 50 caractères')
], authController.updateProfile);

/**
 * @route   PUT /api/auth/password
 * @desc    Changement de mot de passe
 * @access  Private
 */
router.put('/password', authenticateToken, changePasswordValidation, authController.changePassword);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demande de réinitialisation de mot de passe
 * @access  Public
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Format d\'email invalide')
], authController.forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialisation de mot de passe
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token de réinitialisation requis'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
], authController.resetPassword);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Vérification d'email
 * @access  Public
 */
router.post('/verify-email', [
  body('token')
    .notEmpty()
    .withMessage('Token de vérification requis')
], authController.verifyEmail);

/**
 * @route   POST /api/auth/resend-verification
 * @desc    Renvoi de l'email de vérification
 * @access  Private
 */
router.post('/resend-verification', authenticateToken, authController.resendVerification);

module.exports = router;