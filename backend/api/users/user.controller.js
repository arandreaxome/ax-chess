const { validationResult } = require('express-validator');
const User = require('../../models/User');
const GameModel = require('../../models/Game');

/**
 * @desc    Récupérer le profil public d'un utilisateur
 * @route   GET /api/users/profile/:userId
 * @access  Public
 */
const getUserProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Données invalides',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password -refreshTokens -email');
    
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Calculer des statistiques supplémentaires
    const totalGames = user.stats.gamesPlayed;
    const winRate = totalGames > 0 ? Math.round((user.stats.gamesWon / totalGames) * 100) : 0;

    const profile = {
      id: user._id,
      username: user.username,
      profile: user.profile,
      stats: {
        ...user.stats,
        winRate
      },
      rating: {
        current: user.rating.current,
        peak: user.rating.peak
      },
      progression: user.progression,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      isOnline: false // TODO: Implémenter le statut en ligne
    };

    res.json({ user: profile });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Rechercher des utilisateurs
 * @route   GET /api/users/search
 * @access  Private
 */
const searchUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Paramètres de recherche invalides',
        errors: errors.array()
      });
    }

    const { q, limit = 10 } = req.query;
    
    const users = await User.find({
      username: { $regex: q, $options: 'i' },
      isActive: true
    })
    .select('username profile.avatar rating.current stats.gamesPlayed')
    .limit(parseInt(limit))
    .sort({ 'rating.current': -1 });

    res.json({ users });

  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Récupérer le classement des joueurs
 * @route   GET /api/users/leaderboard
 * @access  Public
 */
const getLeaderboard = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    const { limit = 50, skip = 0 } = req.query;
    
    const users = await User.find({ isActive: true })
      .select('username profile.avatar profile.country rating.current stats.gamesPlayed stats.gamesWon')
      .sort({ 'rating.current': -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit));

    const leaderboard = users.map((user, index) => ({
      rank: parseInt(skip) + index + 1,
      id: user._id,
      username: user.username,
      avatar: user.profile.avatar,
      country: user.profile.country,
      rating: user.rating.current,
      gamesPlayed: user.stats.gamesPlayed,
      winRate: user.stats.gamesPlayed > 0 ? 
        Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) : 0
    }));

    res.json({ leaderboard });

  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Récupérer les statistiques d'un utilisateur
 * @route   GET /api/users/:userId/stats
 * @access  Public
 */
const getUserStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('stats rating progression');
    
    if (!user) {
      return res.status(404).json({
        message: 'Utilisateur non trouvé',
        code: 'USER_NOT_FOUND'
      });
    }

    // Calculer des statistiques avancées
    const totalGames = user.stats.gamesPlayed;
    const winRate = totalGames > 0 ? (user.stats.gamesWon / totalGames) * 100 : 0;
    const drawRate = totalGames > 0 ? (user.stats.gamesDraw / totalGames) * 100 : 0;
    const lossRate = totalGames > 0 ? (user.stats.gamesLost / totalGames) * 100 : 0;

    // Récupérer les statistiques des dernières parties
    const recentGames = await GameModel.find({
      $or: [
        { 'players.white.user': userId },
        { 'players.black.user': userId }
      ],
      status: 'finished'
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('result players');

    let recentWins = 0;
    recentGames.forEach(game => {
      const isWhite = game.players.white.user.toString() === userId;
      if ((isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1')) {
        recentWins++;
      }
    });

    const stats = {
      games: {
        total: user.stats.gamesPlayed,
        wins: user.stats.gamesWon,
        losses: user.stats.gamesLost,
        draws: user.stats.gamesDraw,
        winRate: Math.round(winRate),
        drawRate: Math.round(drawRate),
        lossRate: Math.round(lossRate)
      },
      rating: {
        current: user.rating.current,
        peak: user.rating.peak,
        history: user.rating.history.slice(-10) // 10 dernières parties
      },
      progression: user.progression,
      performance: {
        totalPlayTime: user.stats.totalPlayTime,
        longestGame: user.stats.longestGame,
        recentForm: `${recentWins}/${recentGames.length}`
      }
    };

    res.json({ stats });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Récupérer l'historique des parties d'un utilisateur
 * @route   GET /api/users/:userId/games
 * @access  Public
 */
const getUserGames = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Paramètres invalides',
        errors: errors.array()
      });
    }

    const { userId } = req.params;
    const { limit = 20, skip = 0, result } = req.query;

    let query = {
      $or: [
        { 'players.white.user': userId },
        { 'players.black.user': userId }
      ],
      status: 'finished'
    };

    if (result) {
      query.result = result;
    }

    const games = await GameModel.find(query)
      .populate('players.white.user', 'username profile.avatar rating.current')
      .populate('players.black.user', 'username profile.avatar rating.current')
      .sort({ createdAt: -1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .select('players result resultReason gameType timeControl moves createdAt endedAt');

    const gamesWithUserInfo = games.map(game => {
      const isWhite = game.players.white.user._id.toString() === userId;
      const userColor = isWhite ? 'white' : 'black';
      const opponentColor = isWhite ? 'black' : 'white';
      
      let userResult = 'draw';
      if (game.result === '1-0') {
        userResult = isWhite ? 'win' : 'loss';
      } else if (game.result === '0-1') {
        userResult = isWhite ? 'loss' : 'win';
      }

      return {
        id: game._id,
        opponent: game.players[opponentColor].user,
        userColor,
        result: userResult,
        gameResult: game.result,
        resultReason: game.resultReason,
        gameType: game.gameType,
        timeControl: game.timeControl,
        moveCount: game.moves ? game.moves.length : 0,
        duration: game.endedAt ? Math.floor((game.endedAt - game.createdAt) / 1000) : null,
        createdAt: game.createdAt,
        endedAt: game.endedAt
      };
    });

    res.json({ games: gamesWithUserInfo });

  } catch (error) {
    console.error('Erreur lors de la récupération des parties:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Mettre à jour les préférences utilisateur
 * @route   PUT /api/users/preferences
 * @access  Private
 */
const updatePreferences = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Préférences invalides',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const preferences = req.body;

    await User.findByIdAndUpdate(userId, {
      $set: { 'preferences': { ...req.user.preferences, ...preferences } }
    });

    res.json({
      message: 'Préférences mises à jour avec succès',
      preferences: { ...req.user.preferences, ...preferences }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Mettre à jour la personnalisation utilisateur
 * @route   PUT /api/users/customization
 * @access  Private
 */
const updateCustomization = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Personnalisation invalide',
        errors: errors.array()
      });
    }

    const userId = req.user._id;
    const customization = req.body;

    // Vérifier que l'utilisateur possède les thèmes/sets de pièces
    if (customization.boardTheme && !req.user.customization.ownedThemes.includes(customization.boardTheme)) {
      return res.status(400).json({
        message: 'Thème d\'échiquier non possédé',
        code: 'THEME_NOT_OWNED'
      });
    }

    if (customization.pieceSet && !req.user.customization.ownedPieceSets.includes(customization.pieceSet)) {
      return res.status(400).json({
        message: 'Set de pièces non possédé',
        code: 'PIECE_SET_NOT_OWNED'
      });
    }

    await User.findByIdAndUpdate(userId, {
      $set: { 'customization': { ...req.user.customization, ...customization } }
    });

    res.json({
      message: 'Personnalisation mise à jour avec succès',
      customization: { ...req.user.customization, ...customization }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la personnalisation:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

/**
 * @desc    Récupérer l'historique ELO de l'utilisateur
 * @route   GET /api/users/rating-history
 * @access  Private
 */
const getRatingHistory = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user._id;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

    const user = await User.findById(userId).select('rating');
    
    const recentHistory = user.rating.history.filter(entry => 
      entry.date >= cutoffDate
    ).sort((a, b) => a.date - b.date);

    res.json({
      history: recentHistory,
      currentRating: user.rating.current,
      peakRating: user.rating.peak
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique ELO:', error);
    res.status(500).json({
      message: 'Erreur interne du serveur',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Fonctions placeholder pour les autres routes
const followUser = async (req, res) => {
  res.json({ message: 'Fonctionnalité à implémenter' });
};

const unfollowUser = async (req, res) => {
  res.json({ message: 'Fonctionnalité à implémenter' });
};

const getFollowing = async (req, res) => {
  res.json({ following: [] });
};

const getFollowers = async (req, res) => {
  res.json({ followers: [] });
};

const reportUser = async (req, res) => {
  res.json({ message: 'Signalement enregistré' });
};

const getUserAchievements = async (req, res) => {
  res.json({ achievements: [] });
};

module.exports = {
  getUserProfile,
  searchUsers,
  getLeaderboard,
  getUserStats,
  getUserGames,
  updatePreferences,
  updateCustomization,
  getRatingHistory,
  followUser,
  unfollowUser,
  getFollowing,
  getFollowers,
  reportUser,
  getUserAchievements
};