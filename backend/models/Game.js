const mongoose = require('mongoose');

const MoveSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true,
    match: /^[a-h][1-8]$/ // Format algébrique (ex: e2)
  },
  to: {
    type: String,
    required: true,
    match: /^[a-h][1-8]$/
  },
  piece: {
    type: String,
    required: true,
    enum: ['K', 'Q', 'R', 'B', 'N', 'P'] // Notation anglaise
  },
  color: {
    type: String,
    required: true,
    enum: ['white', 'black']
  },
  notation: {
    type: String,
    required: true // Notation algébrique complète (ex: "Nf3", "O-O")
  },
  capturedPiece: {
    type: String,
    enum: ['K', 'Q', 'R', 'B', 'N', 'P'],
    default: null
  },
  isCheck: {
    type: Boolean,
    default: false
  },
  isCheckmate: {
    type: Boolean,
    default: false
  },
  isEnPassant: {
    type: Boolean,
    default: false
  },
  isCastling: {
    type: Boolean,
    default: false
  },
  isPromotion: {
    type: Boolean,
    default: false
  },
  promotionPiece: {
    type: String,
    enum: ['Q', 'R', 'B', 'N'],
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  timeSpent: {
    type: Number, // en secondes
    default: 0
  }
});

const GameSchema = new mongoose.Schema({
  // Joueurs
  players: {
    white: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      timeRemaining: {
        type: Number, // en secondes
        default: 900 // 15 minutes par défaut
      },
      powers: [{
        name: {
          type: String,
          enum: ['teleportation', 'invisibility', 'exchange']
        },
        used: {
          type: Boolean,
          default: false
        },
        usedAt: {
          type: Date,
          default: null
        }
      }]
    },
    black: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      timeRemaining: {
        type: Number,
        default: 900
      },
      powers: [{
        name: {
          type: String,
          enum: ['teleportation', 'invisibility', 'exchange']
        },
        used: {
          type: Boolean,
          default: false
        },
        usedAt: {
          type: Date,
          default: null
        }
      }]
    }
  },

  // État de la partie
  status: {
    type: String,
    enum: ['waiting', 'active', 'paused', 'finished', 'abandoned'],
    default: 'waiting'
  },
  
  result: {
    type: String,
    enum: ['1-0', '0-1', '1/2-1/2', '*'], // Format PGN standard
    default: '*'
  },
  
  resultReason: {
    type: String,
    enum: [
      'checkmate', 'resignation', 'timeout', 'draw_agreement', 
      'stalemate', 'insufficient_material', 'threefold_repetition', 
      'fifty_move_rule', 'abandonment'
    ],
    default: null
  },

  // Configuration de la partie
  gameType: {
    type: String,
    enum: ['classic', 'rapid', 'blitz', 'bullet', 'custom'],
    default: 'classic'
  },
  
  timeControl: {
    initial: {
      type: Number, // en secondes
      default: 900
    },
    increment: {
      type: Number, // en secondes par coup
      default: 0
    }
  },

  // État de l'échiquier
  board: {
    type: [[String]], // Échiquier 8x8 avec notation des pièces
    default: function() {
      return [
        ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'], // Rang 8 (noir)
        ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'], // Rang 7 (noir)
        ['', '', '', '', '', '', '', ''],           // Rang 6
        ['', '', '', '', '', '', '', ''],           // Rang 5
        ['', '', '', '', '', '', '', ''],           // Rang 4
        ['', '', '', '', '', '', '', ''],           // Rang 3
        ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'], // Rang 2 (blanc)
        ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']  // Rang 1 (blanc)
      ];
    }
  },

  // Tour actuel
  currentTurn: {
    type: String,
    enum: ['white', 'black'],
    default: 'white'
  },
  
  moveNumber: {
    type: Number,
    default: 1
  },

  // Historique des coups
  moves: [MoveSchema],
  
  // Positions pour détecter les répétitions
  positionHistory: [{
    fen: String, // Position FEN
    count: {
      type: Number,
      default: 1
    }
  }],

  // États spéciaux
  castlingRights: {
    white: {
      kingside: {
        type: Boolean,
        default: true
      },
      queenside: {
        type: Boolean,
        default: true
      }
    },
    black: {
      kingside: {
        type: Boolean,
        default: true
      },
      queenside: {
        type: Boolean,
        default: true
      }
    }
  },

  enPassantTarget: {
    type: String,
    match: /^[a-h][1-8]$/,
    default: null
  },

  // Compteurs pour les règles
  halfMoveClock: {
    type: Number, // Pour la règle des 50 coups
    default: 0
  },

  // Métadonnées
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  isRanked: {
    type: Boolean,
    default: true
  },
  
  startedAt: {
    type: Date,
    default: null
  },
  
  endedAt: {
    type: Date,
    default: null
  },

  // Chat de la partie (optionnel)
  chat: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      maxlength: 200
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Analyse post-partie (pour futures fonctionnalités)
  analysis: {
    accuracy: {
      white: Number,
      black: Number
    },
    blunders: {
      white: Number,
      black: Number
    },
    bestMove: String,
    evaluation: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les performances
// roomId index is already defined in schema with unique: true
GameSchema.index({ 'players.white.user': 1, 'players.black.user': 1 });
GameSchema.index({ status: 1, createdAt: -1 });
GameSchema.index({ isRanked: 1, result: 1 });

// Propriétés virtuelles
GameSchema.virtual('duration').get(function() {
  if (!this.startedAt) return 0;
  const endTime = this.endedAt || new Date();
  return Math.floor((endTime - this.startedAt) / 1000); // en secondes
});

GameSchema.virtual('pgn').get(function() {
  // Génération PGN basique
  let pgn = '';
  this.moves.forEach((move, index) => {
    if (index % 2 === 0) {
      pgn += `${Math.floor(index / 2) + 1}. `;
    }
    pgn += `${move.notation} `;
  });
  pgn += this.result;
  return pgn.trim();
});

// Méthodes d'instance
GameSchema.methods.addMove = function(moveData) {
  this.moves.push(moveData);
  this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
  if (this.currentTurn === 'white') {
    this.moveNumber++;
  }
  return this.save();
};

GameSchema.methods.getOpponent = function(userId) {
  if (this.players.white.user.toString() === userId.toString()) {
    return this.players.black;
  }
  return this.players.white;
};

GameSchema.methods.getPlayerColor = function(userId) {
  if (this.players.white.user.toString() === userId.toString()) {
    return 'white';
  }
  return 'black';
};

GameSchema.methods.isPlayerTurn = function(userId) {
  const playerColor = this.getPlayerColor(userId);
  return this.currentTurn === playerColor;
};

GameSchema.methods.endGame = function(result, reason) {
  this.status = 'finished';
  this.result = result;
  this.resultReason = reason;
  this.endedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Game', GameSchema);