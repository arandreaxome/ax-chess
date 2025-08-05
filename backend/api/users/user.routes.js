const express = require('express');
const { body, param, query } = require('express-validator');
const userController = require('./user.controller');
const { authenticateToken, optionalAuth } = require('../../middleware/auth');

const router = express.Router();

/**
 * @route   GET /api/users/profile/:userId
 * @desc    Récupérer le profil public d'un utilisateur
 * @access  Public
 */
router.get('/profile/:userId', optionalAuth, [
  param('userId').isMongoId().withMessage('ID utilisateur invalide')
], userController.getUserProfile);

/**
 * @route   GET /api/users/search
 * @desc    Rechercher des utilisateurs
 * @access  Private
 */
router.get('/search', authenticateToken, [
  query('q')
    .isLength({ min: 2, max: 50 })
    .withMessage('Terme de recherche doit contenir entre 2 et 50 caractères'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite doit être entre 1 et 50')
], userController.searchUsers);

/**
 * @route   GET /api/users/leaderboard
 * @desc    Récupérer le classement des joueurs
 * @access  Public
 */
router.get('/leaderboard', [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite doit être entre 1 et 100'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip doit être un nombre positif')
], userController.getLeaderboard);

/**
 * @route   GET /api/users/:userId/stats
 * @desc    Récupérer les statistiques d'un utilisateur
 * @access  Public
 */
router.get('/:userId/stats', [
  param('userId').isMongoId().withMessage('ID utilisateur invalide')
], userController.getUserStats);

/**
 * @route   GET /api/users/:userId/games
 * @desc    Récupérer l'historique des parties d'un utilisateur
 * @access  Public
 */
router.get('/:userId/games', [
  param('userId').isMongoId().withMessage('ID utilisateur invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limite doit être entre 1 et 50'),
  query('skip')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Skip doit être un nombre positif'),
  query('result')
    .optional()
    .isIn(['1-0', '0-1', '1/2-1/2'])
    .withMessage('Résultat invalide')
], userController.getUserGames);

/**
 * @route   PUT /api/users/preferences
 * @desc    Mettre à jour les préférences utilisateur
 * @access  Private
 */
router.put('/preferences', authenticateToken, [
  body('soundEnabled')
    .optional()
    .isBoolean()
    .withMessage('soundEnabled doit être un booléen'),
  body('animationsEnabled')
    .optional()
    .isBoolean()
    .withMessage('animationsEnabled doit être un booléen'),
  body('showCoordinates')
    .optional()
    .isBoolean()
    .withMessage('showCoordinates doit être un booléen'),
  body('autoQueen')
    .optional()
    .isBoolean()
    .withMessage('autoQueen doit être un booléen'),
  body('language')
    .optional()
    .isIn(['fr', 'en', 'es', 'de'])
    .withMessage('Langue non supportée')
], userController.updatePreferences);

/**
 * @route   PUT /api/users/customization
 * @desc    Mettre à jour la personnalisation utilisateur
 * @access  Private
 */
router.put('/customization', authenticateToken, [
  body('boardTheme')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Thème d\'échiquier invalide'),
  body('pieceSet')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('Set de pièces invalide')
], userController.updateCustomization);

/**
 * @route   POST /api/users/follow/:userId
 * @desc    Suivre un utilisateur
 * @access  Private
 */
router.post('/follow/:userId', authenticateToken, [
  param('userId').isMongoId().withMessage('ID utilisateur invalide')
], userController.followUser);

/**
 * @route   DELETE /api/users/follow/:userId
 * @desc    Ne plus suivre un utilisateur
 * @access  Private
 */
router.delete('/follow/:userId', authenticateToken, [
  param('userId').isMongoId().withMessage('ID utilisateur invalide')
], userController.unfollowUser);

/**
 * @route   GET /api/users/following
 * @desc    Récupérer la liste des utilisateurs suivis
 * @access  Private
 */
router.get('/following', authenticateToken, userController.getFollowing);

/**
 * @route   GET /api/users/followers
 * @desc    Récupérer la liste des followers
 * @access  Private
 */
router.get('/followers', authenticateToken, userController.getFollowers);

/**
 * @route   POST /api/users/report/:userId
 * @desc    Signaler un utilisateur
 * @access  Private
 */
router.post('/report/:userId', authenticateToken, [
  param('userId').isMongoId().withMessage('ID utilisateur invalide'),
  body('reason')
    .isIn(['cheating', 'harassment', 'inappropriate_name', 'spam', 'other'])
    .withMessage('Raison de signalement invalide'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description trop longue (500 caractères maximum)')
], userController.reportUser);

/**
 * @route   GET /api/users/achievements
 * @desc    Récupérer les achievements de l'utilisateur
 * @access  Private
 */
router.get('/achievements', authenticateToken, userController.getUserAchievements);

/**
 * @route   GET /api/users/rating-history
 * @desc    Récupérer l'historique ELO de l'utilisateur
 * @access  Private
 */
router.get('/rating-history', authenticateToken, [
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Période doit être entre 1 et 365 jours')
], userController.getRatingHistory);

module.exports = router;