const { validationResult } = require('express-validator');
const Game = require('../../engine/Game');
const GameModel = require('../../models/Game');
const User = require('../../models/User');

// Cache en mémoire pour les parties actives
const activeGames = new Map();
const matchmakingQueue = new Map();

/**
 * @desc    Créer une nouvelle partie
 * @route   POST /api/game/create
 * @access  Private
 */
const createGame = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données de partie invalides',
        errors: errors.array()
      });
    }

    const { timeControl = 900, increment = 0, isRanked = true, gameType = 'classic' } = req.body;
    const userId = req.user._id;

    // Vérifier le nombre de parties actives de l'utilisateur
    const activeGameCount = await GameModel.countDocuments({
      $or: [
        { 'players.white.user': userId },
        { 'players.black.user': userId }
      ],
      status: 'active'
    });

    if (activeGameCount >= 5) {
      return res.status(400).json({
        message: 'Limite de parties actives atteinte (5 maximum)',
        code: 'MAX_GAMES_REACHED'
      });
    }

    // Créer la partie en base de données
    const gameData = new GameModel({
      players: {
        white: {
          user: userId,
          timeRemaining: timeControl
        },
        black: {
          user: null,
          timeRemaining: timeControl
        }
      },
      status: 'waiting',
      gameType,
      timeControl: {
        initial: timeControl,
        increment
      },
      isRanked,
      roomId: generateRoomId()
    });

    await gameData.save();

    res.status(201).json({
      message: 'Partie créée avec succès',
      game: {
        id: gameData._id,
        roomId: gameData.roomId,
        status: gameData.status,
        timeControl: gameData.timeControl,
        gameType: gameData.gameType,
        isRanked: gameData.isRanked
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création de partie:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Rejoindre une partie existante
 * @route   POST /api/game/join/:gameId
 * @access  Private
 */
const joinGame = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { gameId } = req.params;
    const userId = req.user._id;

    // Récupérer la partie
    const gameData = await GameModel.findById(gameId).populate('players.white.user players.black.user');
    
    if (!gameData) {
      return res.status(404).json({
        message: 'Partie non trouvée',
        code: 'GAME_NOT_FOUND'
      });
    }

    // Vérifier que la partie est en attente
    if (gameData.status !== 'waiting') {
      return res.status(400).json({
        message: 'Cette partie n\'est plus disponible',
        code: 'GAME_NOT_AVAILABLE'
      });
    }

    // Vérifier que l'utilisateur n'est pas déjà dans la partie
    if (gameData.players.white.user._id.toString() === userId.toString()) {
      return res.status(400).json({
        message: 'Vous êtes déjà dans cette partie',
        code: 'ALREADY_IN_GAME'
      });
    }

    // Rejoindre comme joueur noir
    gameData.players.black.user = userId;
    gameData.status = 'active';
    gameData.startedAt = new Date();

    await gameData.save();

    // Créer l'instance de jeu en mémoire
    const game = new Game(
      gameData.players.white.user._id.toString(),
      gameData.players.black.user._id.toString(),
      {
        gameId: gameData._id.toString(),
        timeControl: gameData.timeControl.initial,
        increment: gameData.timeControl.increment,
        isRanked: gameData.isRanked
      }
    );

    activeGames.set(gameData._id.toString(), game);

    res.json({
      message: 'Partie rejointe avec succès',
      game: game.getGameState()
    });

  } catch (error) {
    console.error('Erreur lors de la jointure de partie:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Récupérer l'état d'une partie
 * @route   GET /api/game/:gameId
 * @access  Private
 */
const getGame = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id.toString();

    // Vérifier d'abord dans le cache
    let game = activeGames.get(gameId);
    
    if (!game) {
      // Récupérer depuis la base de données
      const gameData = await GameModel.findById(gameId).populate('players.white.user players.black.user');
      
      if (!gameData) {
        return res.status(404).json({
          message: 'Partie non trouvée',
          code: 'GAME_NOT_FOUND'
        });
      }

      // Vérifier que l'utilisateur fait partie de la partie
      const isPlayer = gameData.players.white.user._id.toString() === userId ||
                      gameData.players.black.user._id.toString() === userId;

      if (!isPlayer) {
        return res.status(403).json({
          message: 'Accès non autorisé à cette partie',
          code: 'ACCESS_DENIED'
        });
      }

      // Si la partie est active, recréer l'instance en mémoire
      if (gameData.status === 'active') {
        game = new Game(
          gameData.players.white.user._id.toString(),
          gameData.players.black.user._id.toString(),
          {
            gameId: gameData._id.toString(),
            timeControl: gameData.timeControl.initial,
            increment: gameData.timeControl.increment,
            isRanked: gameData.isRanked
          }
        );

        // Restaurer l'état depuis la base de données
        game.moves = gameData.moves || [];
        game.currentTurn = gameData.currentTurn;
        game.status = gameData.status;
        game.result = gameData.result;

        activeGames.set(gameId, game);
      }
    }

    const gameState = game ? game.getGameState() : {
      id: gameData._id,
      status: gameData.status,
      result: gameData.result,
      players: gameData.players
    };

    res.json({
      game: gameState
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de partie:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Jouer un coup
 * @route   POST /api/game/:gameId/move
 * @access  Private
 */
const makeMove = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données de mouvement invalides',
        errors: errors.array()
      });
    }

    const { gameId } = req.params;
    const { fromRank, fromFile, toRank, toFile, promotion } = req.body;
    const userId = req.user._id.toString();

    // Récupérer la partie du cache
    const game = activeGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        message: 'Partie non trouvée ou inactive',
        code: 'GAME_NOT_FOUND'
      });
    }

    // Tenter de jouer le coup
    const moveResult = game.makeMove(userId, {
      fromRank,
      fromFile,
      toRank,
      toFile,
      promotion
    });

    if (!moveResult.success) {
      return res.status(400).json({
        message: moveResult.message,
        code: moveResult.error
      });
    }

    // Sauvegarder en base de données
    await updateGameInDatabase(gameId, game);

    res.json({
      message: 'Coup joué avec succès',
      move: moveResult.move,
      gameState: moveResult.gameState
    });

  } catch (error) {
    console.error('Erreur lors du mouvement:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Abandonner la partie
 * @route   POST /api/game/:gameId/resign
 * @access  Private
 */
const resign = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id.toString();

    const game = activeGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        message: 'Partie non trouvée ou inactive',
        code: 'GAME_NOT_FOUND'
      });
    }

    const resignResult = game.resign(userId);
    
    if (!resignResult.success) {
      return res.status(400).json({
        message: resignResult.message
      });
    }

    // Sauvegarder en base de données
    await updateGameInDatabase(gameId, game);

    // Retirer du cache
    activeGames.delete(gameId);

    res.json({
      message: 'Partie abandonnée',
      result: resignResult.result,
      reason: resignResult.reason
    });

  } catch (error) {
    console.error('Erreur lors de l\'abandon:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Proposer ou accepter une nulle
 * @route   POST /api/game/:gameId/draw
 * @access  Private
 */
const offerDraw = async (req, res) => {
  try {
    const { gameId } = req.params;
    const userId = req.user._id.toString();

    const game = activeGames.get(gameId);
    
    if (!game) {
      return res.status(404).json({
        message: 'Partie non trouvée ou inactive',
        code: 'GAME_NOT_FOUND'
      });
    }

    const drawResult = game.offerDraw(userId);
    
    if (!drawResult.success) {
      return res.status(400).json({
        message: drawResult.message
      });
    }

    // Sauvegarder en base de données
    await updateGameInDatabase(gameId, game);

    // Retirer du cache si la partie est terminée
    if (game.status === 'finished') {
      activeGames.delete(gameId);
    }

    res.json({
      message: 'Nulle acceptée',
      result: drawResult.result,
      reason: drawResult.reason
    });

  } catch (error) {
    console.error('Erreur lors de la proposition de nulle:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Récupérer l'historique des coups
 * @route   GET /api/game/:gameId/moves
 * @access  Private
 */
const getMoves = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = activeGames.get(gameId);
    let moves = [];

    if (game) {
      moves = game.moves;
    } else {
      const gameData = await GameModel.findById(gameId);
      if (gameData) {
        moves = gameData.moves || [];
      }
    }

    res.json({
      moves
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des coups:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Exporter la partie en format PGN
 * @route   GET /api/game/:gameId/pgn
 * @access  Private
 */
const exportPGN = async (req, res) => {
  try {
    const { gameId } = req.params;

    const game = activeGames.get(gameId);
    let pgn = '';

    if (game) {
      pgn = game.toPGN();
    } else {
      const gameData = await GameModel.findById(gameId).populate('players.white.user players.black.user');
      if (gameData) {
        // Générer le PGN depuis les données de la base
        pgn = generatePGNFromGameData(gameData);
      }
    }

    res.setHeader('Content-Type', 'application/x-chess-pgn');
    res.setHeader('Content-Disposition', `attachment; filename="game_${gameId}.pgn"`);
    res.send(pgn);

  } catch (error) {
    console.error('Erreur lors de l\'export PGN:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * Met à jour une partie en base de données
 * @param {string} gameId - ID de la partie
 * @param {Game} game - Instance de la partie
 */
const updateGameInDatabase = async (gameId, game) => {
  try {
    const gameState = game.getGameState();
    
    await GameModel.findByIdAndUpdate(gameId, {
      status: gameState.status,
      result: gameState.result,
      resultReason: gameState.resultReason,
      currentTurn: gameState.currentTurn,
      moveNumber: gameState.moveNumber,
      moves: gameState.moves,
      'players.white.timeRemaining': gameState.players.white.timeRemaining,
      'players.black.timeRemaining': gameState.players.black.timeRemaining,
      endedAt: gameState.endTime,
      lastMoveTime: gameState.lastMoveTime
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour en base:', error);
  }
};

/**
 * Génère un ID de salon unique
 * @returns {string} ID du salon
 */
const generateRoomId = () => {
  return 'room_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Génère un PGN depuis les données de la base
 * @param {Object} gameData - Données de la partie
 * @returns {string} PGN
 */
const generatePGNFromGameData = (gameData) => {
  let pgn = `[Event "AX Chess Game"]
[Site "AX Chess Platform"]
[Date "${gameData.createdAt.toISOString().split('T')[0]}"]
[Round "1"]
[White "${gameData.players.white.user.username}"]
[Black "${gameData.players.black.user.username}"]
[Result "${gameData.result}"]

`;

  // Ajouter les coups
  if (gameData.moves && gameData.moves.length > 0) {
    for (let i = 0; i < gameData.moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      pgn += `${moveNumber}. `;
      
      if (gameData.moves[i]) {
        pgn += `${gameData.moves[i].notation} `;
      }
      
      if (gameData.moves[i + 1]) {
        pgn += `${gameData.moves[i + 1].notation} `;
      }
    }
  }
  
  pgn += gameData.result;
  return pgn;
};

// Fonctions supplémentaires pour les autres routes...
const getUserActiveGames = async (req, res) => {
  // TODO: Implémenter
  res.json({ games: [] });
};

const getUserGameHistory = async (req, res) => {
  // TODO: Implémenter
  res.json({ games: [] });
};

const getAvailableGames = async (req, res) => {
  // TODO: Implémenter
  res.json({ games: [] });
};

const joinMatchmaking = async (req, res) => {
  // TODO: Implémenter
  res.json({ message: 'Ajouté à la file d\'attente' });
};

const leaveMatchmaking = async (req, res) => {
  // TODO: Implémenter
  res.json({ message: 'Retiré de la file d\'attente' });
};

const sendChatMessage = async (req, res) => {
  // TODO: Implémenter
  res.json({ message: 'Message envoyé' });
};

const getGameAnalysis = async (req, res) => {
  // TODO: Implémenter
  res.json({ analysis: {} });
};

const importPGN = async (req, res) => {
  // TODO: Implémenter
  res.json({ message: 'PGN importé' });
};

module.exports = {
  createGame,
  joinGame,
  getGame,
  makeMove,
  resign,
  offerDraw,
  getMoves,
  exportPGN,
  getUserActiveGames,
  getUserGameHistory,
  getAvailableGames,
  joinMatchmaking,
  leaveMatchmaking,
  sendChatMessage,
  getGameAnalysis,
  importPGN
};