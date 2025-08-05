const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Le nom d\'utilisateur est requis'],
    unique: true,
    trim: true,
    minlength: [3, 'Le nom d\'utilisateur doit contenir au moins 3 caractères'],
    maxlength: [20, 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Format d\'email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  
  // Profil utilisateur
  profile: {
    avatar: {
      type: String,
      default: null
    },
    bio: {
      type: String,
      maxlength: [200, 'La bio ne peut pas dépasser 200 caractères'],
      default: ''
    },
    country: {
      type: String,
      default: null
    },
    dateOfBirth: {
      type: Date,
      default: null
    }
  },

  // Statistiques de jeu
  stats: {
    gamesPlayed: {
      type: Number,
      default: 0
    },
    gamesWon: {
      type: Number,
      default: 0
    },
    gamesLost: {
      type: Number,
      default: 0
    },
    gamesDraw: {
      type: Number,
      default: 0
    },
    totalPlayTime: {
      type: Number, // en minutes
      default: 0
    },
    longestGame: {
      type: Number, // en minutes
      default: 0
    }
  },

  // Système de progression
  progression: {
    level: {
      type: Number,
      default: 1
    },
    experience: {
      type: Number,
      default: 0
    },
    coins: {
      type: Number,
      default: 100 // Coins de départ
    }
  },

  // Classement ELO
  rating: {
    current: {
      type: Number,
      default: 1200
    },
    peak: {
      type: Number,
      default: 1200
    },
    history: [{
      rating: Number,
      change: Number,
      gameId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
      },
      date: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Personnalisation
  customization: {
    boardTheme: {
      type: String,
      default: 'classic'
    },
    pieceSet: {
      type: String,
      default: 'standard'
    },
    ownedThemes: [{
      type: String,
      default: ['classic']
    }],
    ownedPieceSets: [{
      type: String,
      default: ['standard']
    }]
  },

  // Préférences
  preferences: {
    soundEnabled: {
      type: Boolean,
      default: true
    },
    animationsEnabled: {
      type: Boolean,
      default: true
    },
    showCoordinates: {
      type: Boolean,
      default: true
    },
    autoQueen: {
      type: Boolean,
      default: false
    },
    language: {
      type: String,
      default: 'fr'
    }
  },

  // Statut et sécurité
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date,
    default: null
  },
  refreshTokens: [{
    token: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 2592000 // 30 jours
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour les performances
UserSchema.index({ username: 1, email: 1 });
UserSchema.index({ 'rating.current': -1 });
UserSchema.index({ createdAt: -1 });

// Propriétés virtuelles
UserSchema.virtual('winRate').get(function() {
  if (this.stats.gamesPlayed === 0) return 0;
  return Math.round((this.stats.gamesWon / this.stats.gamesPlayed) * 100);
});

UserSchema.virtual('level').get(function() {
  return Math.floor(this.progression.experience / 1000) + 1;
});

// Middleware pre-save pour hasher le mot de passe
UserSchema.pre('save', async function(next) {
  // Ne hasher que si le mot de passe a été modifié
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Méthodes d'instance
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.addExperience = function(amount) {
  this.progression.experience += amount;
  return this.save();
};

UserSchema.methods.updateRating = function(newRating, gameId) {
  const change = newRating - this.rating.current;
  
  this.rating.history.push({
    rating: newRating,
    change: change,
    gameId: gameId,
    date: new Date()
  });
  
  this.rating.current = newRating;
  if (newRating > this.rating.peak) {
    this.rating.peak = newRating;
  }
  
  return this.save();
};

UserSchema.methods.toSafeJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.refreshTokens;
  return user;
};

module.exports = mongoose.model('User', UserSchema);