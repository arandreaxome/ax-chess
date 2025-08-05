const express = require('express');
const { body, param } = require('express-validator');
const gameController = require('./game.controller');
const { authenticateToken } = require('../../middleware/auth');

const router = express.Router();

// Validation pour créer une partie
const createGameValidation = [
  body('timeControl')
    .optional()
    .isInt({ min: 60, max: 7200 })
    .withMessage('Contrôle du temps doit être entre 1 minute et 2 heures'),
  
  body('increment')
    .optional()
    .isInt({ min: 0, max: 60 })
    .withMessage('Incrément doit être entre 0 et 60 secondes'),
  
  body('isRanked')
    .optional()
    .isBoolean()
    .withMessage('isRanked doit être un booléen'),
  
  body('gameType')
    .optional()
    .isIn(['classic', 'rapid', 'blitz', 'bullet'])
    .withMessage('Type de partie invalide')
];

// Validation pour rejoindre une partie
const joinGameValidation = [
  param('gameId')
    .notEmpty()
    .withMessage('ID de partie requis')
];

// Validation pour un mouvement
const makeMoveValidation = [
  param('gameId')
    .notEmpty()
    .withMessage('ID de partie requis'),
  
  body('fromRank')
    .isInt({ min: 0, max: 7 })
    .withMessage('Rang de départ invalide'),
  
  body('fromFile')
    .isInt({ min: 0, max: 7 })
    .withMessage('Colonne de départ invalide'),
  
  body('toRank')
    .isInt({ min: 0, max: 7 })
    .withMessage('Rang de destination invalide'),
  
  body('toFile')
    .isInt({ min: 0, max: 7 })
    .withMessage('Colonne de destination invalide'),
  
  body('promotion')
    .optional()
    .isIn(['Q', 'R', 'B', 'N'])
    .withMessage('Pièce de promotion invalide')
];

/**
 * @route   POST /api/game/create
 * @desc    Créer une nouvelle partie
 * @access  Private
 */
router.post('/create', authenticateToken, createGameValidation, gameController.createGame);

/**
 * @route   POST /api/game/join/:gameId
 * @desc    Rejoindre une partie existante
 * @access  Private
 */
router.post('/join/:gameId', authenticateToken, joinGameValidation, gameController.joinGame);

/**
 * @route   GET /api/game/:gameId
 * @desc    Récupérer l'état d'une partie
 * @access  Private
 */
router.get('/:gameId', authenticateToken, [
  param('gameId').notEmpty().withMessage('ID de partie requis')
], gameController.getGame);

/**
 * @route   POST /api/game/:gameId/move
 * @desc    Jouer un coup
 * @access  Private
 */
router.post('/:gameId/move', authenticateToken, makeMoveValidation, gameController.makeMove);

/**
 * @route   POST /api/game/:gameId/resign
 * @desc    Abandonner la partie
 * @access  Private
 */
router.post('/:gameId/resign', authenticateToken, [
  param('gameId').notEmpty().withMessage('ID de partie requis')
], gameController.resign);

/**
 * @route   POST /api/game/:gameId/draw
 * @desc    Proposer ou accepter une nulle
 * @access  Private
 */
router.post('/:gameId/draw', authenticateToken, [
  param('gameId').notEmpty().withMessage('ID de partie requis')
], gameController.offerDraw);

/**
 * @route   GET /api/game/:gameId/moves
 * @desc    Récupérer l'historique des coups
 * @access  Private
 */
router.get('/:gameId/moves', authenticateToken, [
  param('gameId').notEmpty().withMessage('ID de partie requis')
], gameController.getMoves);

/**
 * @route   GET /api/game/:gameId/pgn
 * @desc    Exporter la partie en format PGN
 * @access  Private
 */
router.get('/:gameId/pgn', authenticateToken, [
  param('gameId').notEmpty().withMessage('ID de partie requis')
], gameController.exportPGN);

/**
 * @route   GET /api/game/user/active
 * @desc    Récupérer les parties actives de l'utilisateur
 * @access  Private
 */
router.get('/user/active', authenticateToken, gameController.getUserActiveGames);

/**
 * @route   GET /api/game/user/history
 * @desc    Récupérer l'historique des parties de l'utilisateur
 * @access  Private
 */
router.get('/user/history', authenticateToken, gameController.getUserGameHistory);

/**
 * @route   GET /api/game/lobby/available
 * @desc    Récupérer les parties disponibles dans le lobby
 * @access  Private
 */
router.get('/lobby/available', authenticateToken, gameController.getAvailableGames);

/**
 * @route   POST /api/game/matchmaking
 * @desc    Rejoindre la file d'attente de matchmaking
 * @access  Private
 */
router.post('/matchmaking', authenticateToken, [
  body('timeControl')
    .optional()
    .isInt({ min: 60, max: 7200 })
    .withMessage('Contrôle du temps invalide'),
  
  body('gameType')
    .optional()
    .isIn(['classic', 'rapid', 'blitz', 'bullet'])
    .withMessage('Type de partie invalide')
], gameController.joinMatchmaking);

/**
 * @route   DELETE /api/game/matchmaking
 * @desc    Quitter la file d'attente de matchmaking
 * @access  Private
 */
router.delete('/matchmaking', authenticateToken, gameController.leaveMatchmaking);

/**
 * @route   POST /api/game/:gameId/chat
 * @desc    Envoyer un message dans le chat de la partie
 * @access  Private
 */
router.post('/:gameId/chat', authenticateToken, [
  param('gameId').notEmpty().withMessage('ID de partie requis'),
  body('message')
    .isLength({ min: 1, max: 200 })
    .withMessage('Message doit contenir entre 1 et 200 caractères')
], gameController.sendChatMessage);

/**
 * @route   GET /api/game/:gameId/analysis
 * @desc    Récupérer l'analyse de la partie
 * @access  Private
 */
router.get('/:gameId/analysis', authenticateToken, [
  param('gameId').notEmpty().withMessage('ID de partie requis')
], gameController.getGameAnalysis);

/**
 * @route   POST /api/game/import-pgn
 * @desc    Importer une partie depuis un fichier PGN
 * @access  Private
 */
router.post('/import-pgn', authenticateToken, [
  body('pgn')
    .notEmpty()
    .withMessage('Données PGN requises')
], gameController.importPGN);

module.exports = router;