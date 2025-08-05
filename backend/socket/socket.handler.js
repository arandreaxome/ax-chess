const jwt = require('jsonwebtoken');
const User = require('../models/User');
const GameModel = require('../models/Game');

// Stockage des connexions actives
const connectedUsers = new Map(); // socketId -> userId
const userSockets = new Map();    // userId -> Set of socketIds
const gameRooms = new Map();      // gameId -> Set of socketIds

/**
 * Gestionnaire principal des connexions Socket.IO
 * @param {SocketIO.Server} io - Instance Socket.IO
 */
const socketHandler = (io) => {
  // Middleware d'authentification pour Socket.IO
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Token d\'authentification requis'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password -refreshTokens');
      
      if (!user || !user.isActive) {
        return next(new Error('Utilisateur non trouvé ou désactivé'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();

    } catch (error) {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ Utilisateur connecté: ${socket.user.username} (${socket.id})`);
    
    // Enregistrer la connexion
    connectedUsers.set(socket.id, socket.userId);
    
    if (!userSockets.has(socket.userId)) {
      userSockets.set(socket.userId, new Set());
    }
    userSockets.get(socket.userId).add(socket.id);

    // Rejoindre les salons des parties actives
    joinActiveGameRooms(socket);

    // Gestionnaires d'événements
    socket.on('game:join', (data) => handleGameJoin(socket, data));
    socket.on('game:leave', (data) => handleGameLeave(socket, data));
    socket.on('game:move', (data) => handleGameMove(socket, data));
    socket.on('game:resign', (data) => handleGameResign(socket, data));
    socket.on('game:draw-offer', (data) => handleDrawOffer(socket, data));
    socket.on('game:draw-response', (data) => handleDrawResponse(socket, data));
    socket.on('game:chat', (data) => handleGameChat(socket, data));
    socket.on('game:spectate', (data) => handleGameSpectate(socket, data));
    
    // Matchmaking
    socket.on('matchmaking:join', (data) => handleMatchmakingJoin(socket, data));
    socket.on('matchmaking:leave', () => handleMatchmakingLeave(socket));
    
    // Gestion de la déconnexion
    socket.on('disconnect', () => handleDisconnect(socket));
  });
};

/**
 * Rejoindre les salons des parties actives de l'utilisateur
 * @param {Socket} socket - Socket de l'utilisateur
 */
const joinActiveGameRooms = async (socket) => {
  try {
    const activeGames = await GameModel.find({
      $or: [
        { 'players.white.user': socket.userId },
        { 'players.black.user': socket.userId }
      ],
      status: { $in: ['waiting', 'active'] }
    }).select('_id roomId');

    for (const game of activeGames) {
      const roomId = `game:${game._id}`;
      socket.join(roomId);
      
      if (!gameRooms.has(game._id.toString())) {
        gameRooms.set(game._id.toString(), new Set());
      }
      gameRooms.get(game._id.toString()).add(socket.id);
      
      console.log(`👥 ${socket.user.username} a rejoint le salon ${roomId}`);
    }
  } catch (error) {
    console.error('Erreur lors de la jointure des salons:', error);
  }
};

/**
 * Rejoindre une partie
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Données de la partie
 */
const handleGameJoin = async (socket, data) => {
  try {
    const { gameId } = data;
    
    if (!gameId) {
      return socket.emit('error', { message: 'ID de partie requis' });
    }

    const game = await GameModel.findById(gameId).populate('players.white.user players.black.user');
    
    if (!game) {
      return socket.emit('error', { message: 'Partie non trouvée' });
    }

    // Vérifier que l'utilisateur fait partie de la partie
    const isPlayer = game.players.white.user?._id.toString() === socket.userId ||
                    game.players.black.user?._id.toString() === socket.userId;

    if (!isPlayer) {
      return socket.emit('error', { message: 'Vous ne faites pas partie de cette partie' });
    }

    const roomId = `game:${gameId}`;
    socket.join(roomId);

    if (!gameRooms.has(gameId)) {
      gameRooms.set(gameId, new Set());
    }
    gameRooms.get(gameId).add(socket.id);

    // Notifier les autres joueurs
    socket.to(roomId).emit('game:player-joined', {
      userId: socket.userId,
      username: socket.user.username
    });

    // Envoyer l'état de la partie
    socket.emit('game:state', {
      game: game.toObject()
    });

    console.log(`🎮 ${socket.user.username} a rejoint la partie ${gameId}`);

  } catch (error) {
    console.error('Erreur lors de la jointure de partie:', error);
    socket.emit('error', { message: 'Erreur lors de la jointure de partie' });
  }
};

/**
 * Quitter une partie
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Données de la partie
 */
const handleGameLeave = (socket, data) => {
  const { gameId } = data;
  
  if (!gameId) {
    return socket.emit('error', { message: 'ID de partie requis' });
  }

  const roomId = `game:${gameId}`;
  socket.leave(roomId);

  if (gameRooms.has(gameId)) {
    gameRooms.get(gameId).delete(socket.id);
    if (gameRooms.get(gameId).size === 0) {
      gameRooms.delete(gameId);
    }
  }

  // Notifier les autres joueurs
  socket.to(roomId).emit('game:player-left', {
    userId: socket.userId,
    username: socket.user.username
  });

  console.log(`🚪 ${socket.user.username} a quitté la partie ${gameId}`);
};

/**
 * Jouer un coup
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Données du mouvement
 */
const handleGameMove = async (socket, data) => {
  try {
    const { gameId, move } = data;
    
    if (!gameId || !move) {
      return socket.emit('error', { message: 'Données de mouvement invalides' });
    }

    // TODO: Intégrer avec le moteur de jeu
    // Pour l'instant, on simule la validation et l'exécution
    
    const roomId = `game:${gameId}`;
    
    // Émettre le mouvement à tous les joueurs de la partie
    socket.to(roomId).emit('game:move', {
      playerId: socket.userId,
      move: move,
      timestamp: new Date()
    });

    // Confirmer au joueur qui a joué
    socket.emit('game:move-confirmed', {
      move: move,
      timestamp: new Date()
    });

    console.log(`♟️ ${socket.user.username} a joué un coup dans la partie ${gameId}`);

  } catch (error) {
    console.error('Erreur lors du mouvement:', error);
    socket.emit('error', { message: 'Erreur lors du mouvement' });
  }
};

/**
 * Abandon de partie
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Données de l'abandon
 */
const handleGameResign = async (socket, data) => {
  try {
    const { gameId } = data;
    
    if (!gameId) {
      return socket.emit('error', { message: 'ID de partie requis' });
    }

    const roomId = `game:${gameId}`;
    
    // Notifier tous les joueurs de l'abandon
    socket.to(roomId).emit('game:resigned', {
      playerId: socket.userId,
      username: socket.user.username,
      timestamp: new Date()
    });

    socket.emit('game:resign-confirmed', {
      timestamp: new Date()
    });

    console.log(`🏳️ ${socket.user.username} a abandonné la partie ${gameId}`);

  } catch (error) {
    console.error('Erreur lors de l\'abandon:', error);
    socket.emit('error', { message: 'Erreur lors de l\'abandon' });
  }
};

/**
 * Proposition de nulle
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Données de la proposition
 */
const handleDrawOffer = (socket, data) => {
  const { gameId } = data;
  
  if (!gameId) {
    return socket.emit('error', { message: 'ID de partie requis' });
  }

  const roomId = `game:${gameId}`;
  
  socket.to(roomId).emit('game:draw-offered', {
    playerId: socket.userId,
    username: socket.user.username,
    timestamp: new Date()
  });

  console.log(`🤝 ${socket.user.username} propose une nulle dans la partie ${gameId}`);
};

/**
 * Réponse à une proposition de nulle
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Données de la réponse
 */
const handleDrawResponse = (socket, data) => {
  const { gameId, accepted } = data;
  
  if (!gameId || typeof accepted !== 'boolean') {
    return socket.emit('error', { message: 'Données de réponse invalides' });
  }

  const roomId = `game:${gameId}`;
  
  socket.to(roomId).emit('game:draw-response', {
    playerId: socket.userId,
    username: socket.user.username,
    accepted,
    timestamp: new Date()
  });

  const action = accepted ? 'accepté' : 'refusé';
  console.log(`🤝 ${socket.user.username} a ${action} la nulle dans la partie ${gameId}`);
};

/**
 * Message de chat dans une partie
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Données du message
 */
const handleGameChat = async (socket, data) => {
  try {
    const { gameId, message } = data;
    
    if (!gameId || !message || message.trim().length === 0) {
      return socket.emit('error', { message: 'Message invalide' });
    }

    if (message.length > 200) {
      return socket.emit('error', { message: 'Message trop long (200 caractères maximum)' });
    }

    const roomId = `game:${gameId}`;
    
    const chatMessage = {
      id: Date.now().toString(),
      userId: socket.userId,
      username: socket.user.username,
      message: message.trim(),
      timestamp: new Date()
    };

    // Envoyer à tous les joueurs de la partie (y compris l'expéditeur)
    socket.to(roomId).emit('game:chat', chatMessage);
    socket.emit('game:chat', chatMessage);

    // TODO: Sauvegarder en base de données si nécessaire

  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    socket.emit('error', { message: 'Erreur lors de l\'envoi du message' });
  }
};

/**
 * Spectateur d'une partie
 * @param {Socket} socket - Socket du spectateur
 * @param {Object} data - Données de la partie à regarder
 */
const handleGameSpectate = async (socket, data) => {
  try {
    const { gameId } = data;
    
    if (!gameId) {
      return socket.emit('error', { message: 'ID de partie requis' });
    }

    const game = await GameModel.findById(gameId).populate('players.white.user players.black.user');
    
    if (!game) {
      return socket.emit('error', { message: 'Partie non trouvée' });
    }

    const roomId = `game:${gameId}:spectators`;
    socket.join(roomId);

    // Envoyer l'état de la partie au spectateur
    socket.emit('game:spectate-state', {
      game: game.toObject()
    });

    // Notifier les autres spectateurs
    socket.to(roomId).emit('game:spectator-joined', {
      userId: socket.userId,
      username: socket.user.username
    });

    console.log(`👁️ ${socket.user.username} regarde la partie ${gameId}`);

  } catch (error) {
    console.error('Erreur lors du spectating:', error);
    socket.emit('error', { message: 'Erreur lors du spectating' });
  }
};

/**
 * Rejoindre la file d'attente de matchmaking
 * @param {Socket} socket - Socket de l'utilisateur
 * @param {Object} data - Préférences de matchmaking
 */
const handleMatchmakingJoin = (socket, data) => {
  const { timeControl = 900, gameType = 'classic' } = data;
  
  socket.join('matchmaking');
  
  socket.matchmakingPrefs = {
    timeControl,
    gameType,
    rating: socket.user.rating.current,
    joinedAt: new Date()
  };

  socket.emit('matchmaking:joined', {
    message: 'Recherche d\'adversaire en cours...',
    preferences: socket.matchmakingPrefs
  });

  // TODO: Implémenter la logique de matchmaking
  console.log(`🔍 ${socket.user.username} recherche un adversaire`);
};

/**
 * Quitter la file d'attente de matchmaking
 * @param {Socket} socket - Socket de l'utilisateur
 */
const handleMatchmakingLeave = (socket) => {
  socket.leave('matchmaking');
  delete socket.matchmakingPrefs;
  
  socket.emit('matchmaking:left', {
    message: 'Recherche annulée'
  });

  console.log(`❌ ${socket.user.username} a annulé la recherche`);
};

/**
 * Gestion de la déconnexion
 * @param {Socket} socket - Socket qui se déconnecte
 */
const handleDisconnect = (socket) => {
  console.log(`❌ Utilisateur déconnecté: ${socket.user.username} (${socket.id})`);
  
  // Nettoyer les références
  connectedUsers.delete(socket.id);
  
  if (userSockets.has(socket.userId)) {
    userSockets.get(socket.userId).delete(socket.id);
    if (userSockets.get(socket.userId).size === 0) {
      userSockets.delete(socket.userId);
    }
  }

  // Nettoyer les salons de jeu
  for (const [gameId, socketSet] of gameRooms.entries()) {
    if (socketSet.has(socket.id)) {
      socketSet.delete(socket.id);
      if (socketSet.size === 0) {
        gameRooms.delete(gameId);
      }
    }
  }

  // Quitter le matchmaking si nécessaire
  if (socket.matchmakingPrefs) {
    handleMatchmakingLeave(socket);
  }
};

/**
 * Utilitaires pour l'interaction avec Socket.IO depuis d'autres parties du code
 */
const socketUtils = {
  /**
   * Émettre un événement à tous les sockets d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} event - Nom de l'événement
   * @param {Object} data - Données à envoyer
   */
  emitToUser: (userId, event, data) => {
    if (userSockets.has(userId)) {
      for (const socketId of userSockets.get(userId)) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
  },

  /**
   * Émettre un événement à tous les joueurs d'une partie
   * @param {string} gameId - ID de la partie
   * @param {string} event - Nom de l'événement
   * @param {Object} data - Données à envoyer
   */
  emitToGame: (gameId, event, data) => {
    if (gameRooms.has(gameId)) {
      for (const socketId of gameRooms.get(gameId)) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit(event, data);
        }
      }
    }
  },

  /**
   * Vérifier si un utilisateur est en ligne
   * @param {string} userId - ID de l'utilisateur
   * @returns {boolean} True si en ligne
   */
  isUserOnline: (userId) => {
    return userSockets.has(userId) && userSockets.get(userId).size > 0;
  },

  /**
   * Obtenir le nombre d'utilisateurs connectés
   * @returns {number} Nombre d'utilisateurs en ligne
   */
  getOnlineCount: () => {
    return userSockets.size;
  }
};

module.exports = socketHandler;
module.exports.socketUtils = socketUtils;