const Board = require('./board/Board');
const MoveValidator = require('./moves/MoveValidator');
const { GAME_RESULTS } = require('../../shared/constants/chess-notation');

/**
 * Classe principale représentant une partie d'échecs
 * Orchestre tous les aspects du jeu : plateau, règles, états
 */
class Game {
  constructor(whitePlayerId, blackPlayerId, options = {}) {
    this.id = options.gameId || this.generateGameId();
    this.players = {
      white: { id: whitePlayerId, timeRemaining: options.timeControl || 900 },
      black: { id: blackPlayerId, timeRemaining: options.timeControl || 900 }
    };
    
    this.board = new Board();
    this.validator = new MoveValidator(this.board);
    
    // État de la partie
    this.status = 'active';
    this.currentTurn = 'white';
    this.result = GAME_RESULTS.ONGOING;
    this.resultReason = null;
    
    // Historique et métadonnées
    this.moves = [];
    this.moveNumber = 1;
    this.startTime = new Date();
    this.lastMoveTime = new Date();
    
    // Configuration
    this.timeControl = options.timeControl || 900; // 15 minutes par défaut
    this.increment = options.increment || 0;
    this.isRanked = options.isRanked !== false;
    
    // Pouvoirs spéciaux (Phase 2)
    this.powers = {
      white: this.generateRandomPowers(),
      black: this.generateRandomPowers()
    };
    
    // Statistiques de la partie
    this.stats = {
      totalMoves: 0,
      captures: { white: 0, black: 0 },
      checks: { white: 0, black: 0 },
      castling: { white: false, black: false }
    };
  }

  /**
   * Tente de jouer un coup
   * @param {string} playerId - ID du joueur
   * @param {Object} moveData - Données du mouvement
   * @returns {Object} Résultat de la tentative
   */
  makeMove(playerId, moveData) {
    try {
      // Vérifications préliminaires
      const preliminaryCheck = this.validateMoveRequest(playerId, moveData);
      if (!preliminaryCheck.isValid) {
        return preliminaryCheck;
      }

      // Valider le mouvement avec le moteur d'échecs
      const validation = this.validator.isMoveLegal({
        ...moveData,
        color: this.currentTurn
      });

      if (!validation.isValid) {
        return {
          success: false,
          error: validation.reason,
          message: validation.message
        };
      }

      // Exécuter le mouvement
      const moveResult = this.executeMove(validation.move);

      // Mettre à jour l'état de la partie
      this.updateGameState(moveResult);

      // Changer de tour
      this.switchTurn();

      return {
        success: true,
        move: moveResult,
        gameState: this.getGameState()
      };

    } catch (error) {
      console.error('Erreur lors de l\'exécution du mouvement:', error);
      return {
        success: false,
        error: 'EXECUTION_ERROR',
        message: 'Erreur lors de l\'exécution du mouvement'
      };
    }
  }

  /**
   * Valide la demande de mouvement
   * @param {string} playerId - ID du joueur
   * @param {Object} moveData - Données du mouvement
   * @returns {Object} Résultat de la validation
   */
  validateMoveRequest(playerId, moveData) {
    // Vérifier que la partie est active
    if (this.status !== 'active') {
      return {
        isValid: false,
        reason: 'GAME_NOT_ACTIVE',
        message: 'La partie n\'est pas active'
      };
    }

    // Vérifier que c'est le tour du joueur
    if (this.players[this.currentTurn].id !== playerId) {
      return {
        isValid: false,
        reason: 'NOT_YOUR_TURN',
        message: 'Ce n\'est pas votre tour'
      };
    }

    // Vérifier les données du mouvement
    if (!moveData || typeof moveData.fromRank === 'undefined' || 
        typeof moveData.fromFile === 'undefined' ||
        typeof moveData.toRank === 'undefined' || 
        typeof moveData.toFile === 'undefined') {
      return {
        isValid: false,
        reason: 'INVALID_MOVE_DATA',
        message: 'Données de mouvement invalides'
      };
    }

    return { isValid: true };
  }

  /**
   * Exécute le mouvement sur l'échiquier
   * @param {Object} move - Le mouvement validé
   * @returns {Object} Résultat de l'exécution
   */
  executeMove(move) {
    // Enregistrer l'heure du mouvement
    const moveTime = new Date();
    const timeSpent = Math.floor((moveTime - this.lastMoveTime) / 1000);

    // Exécuter le mouvement sur l'échiquier
    const moveInfo = this.board.makeMove(move);

    // Enrichir les informations du mouvement
    const enrichedMove = {
      ...move,
      ...moveInfo,
      moveNumber: this.currentTurn === 'white' ? this.moveNumber : this.moveNumber,
      timestamp: moveTime,
      timeSpent,
      player: this.currentTurn
    };

    // Ajouter à l'historique
    this.moves.push(enrichedMove);

    // Mettre à jour les statistiques
    this.updateMoveStats(enrichedMove);

    this.lastMoveTime = moveTime;
    
    return enrichedMove;
  }

  /**
   * Met à jour l'état de la partie après un mouvement
   * @param {Object} move - Le mouvement exécuté
   */
  updateGameState(move) {
    // Vérifier les conditions de fin de partie
    const opponentColor = this.currentTurn === 'white' ? 'black' : 'white';
    
    if (move.isCheckmate) {
      this.endGame(
        this.currentTurn === 'white' ? GAME_RESULTS.WHITE_WINS : GAME_RESULTS.BLACK_WINS,
        'checkmate'
      );
    } else if (move.isStalemate) {
      this.endGame(GAME_RESULTS.DRAW, 'stalemate');
    } else if (this.isDrawByRepetition()) {
      this.endGame(GAME_RESULTS.DRAW, 'threefold_repetition');
    } else if (this.isDrawByFiftyMoveRule()) {
      this.endGame(GAME_RESULTS.DRAW, 'fifty_move_rule');
    } else if (this.isDrawByInsufficientMaterial()) {
      this.endGame(GAME_RESULTS.DRAW, 'insufficient_material');
    }

    // Mettre à jour le temps restant
    this.updatePlayerTime();
  }

  /**
   * Change le tour du joueur
   */
  switchTurn() {
    if (this.status === 'active') {
      this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';
      
      if (this.currentTurn === 'white') {
        this.moveNumber++;
      }
    }
  }

  /**
   * Met à jour les statistiques du mouvement
   * @param {Object} move - Le mouvement
   */
  updateMoveStats(move) {
    this.stats.totalMoves++;

    if (move.isCapture) {
      this.stats.captures[this.currentTurn]++;
    }

    if (move.isCheck) {
      this.stats.checks[this.currentTurn]++;
    }

    if (move.isCastling) {
      this.stats.castling[this.currentTurn] = true;
    }
  }

  /**
   * Met à jour le temps restant des joueurs
   */
  updatePlayerTime() {
    if (this.timeControl > 0) {
      const lastMove = this.moves[this.moves.length - 1];
      if (lastMove) {
        const player = this.players[lastMove.player];
        player.timeRemaining = Math.max(0, player.timeRemaining - lastMove.timeSpent + this.increment);
        
        // Vérifier si le temps est écoulé
        if (player.timeRemaining === 0) {
          const winner = lastMove.player === 'white' ? GAME_RESULTS.BLACK_WINS : GAME_RESULTS.WHITE_WINS;
          this.endGame(winner, 'timeout');
        }
      }
    }
  }

  /**
   * Termine la partie
   * @param {string} result - Résultat de la partie
   * @param {string} reason - Raison de la fin
   */
  endGame(result, reason) {
    this.status = 'finished';
    this.result = result;
    this.resultReason = reason;
    this.endTime = new Date();
  }

  /**
   * Vérifie la nulle par répétition (3 fois)
   * @returns {boolean} True si nulle par répétition
   */
  isDrawByRepetition() {
    const currentPosition = this.board.toFEN();
    let count = 0;

    // Compter les occurrences de cette position
    for (const positionEntry of this.board.positionHistory) {
      if (positionEntry.fen === currentPosition) {
        count = positionEntry.count;
        break;
      }
    }

    return count >= 3;
  }

  /**
   * Vérifie la nulle par la règle des 50 coups
   * @returns {boolean} True si nulle par 50 coups
   */
  isDrawByFiftyMoveRule() {
    return this.board.halfMoveClock >= 50;
  }

  /**
   * Vérifie la nulle par matériel insuffisant
   * @returns {boolean} True si matériel insuffisant
   */
  isDrawByInsufficientMaterial() {
    const pieces = { white: [], black: [] };

    // Recenser toutes les pièces
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.board.getPiece(rank, file);
        if (piece && piece.type !== 'K') {
          pieces[piece.color].push(piece.type);
        }
      }
    }

    // Vérifier les cas de matériel insuffisant
    const whitePieces = pieces.white.sort();
    const blackPieces = pieces.black.sort();

    // Roi contre roi
    if (whitePieces.length === 0 && blackPieces.length === 0) {
      return true;
    }

    // Roi + fou/cavalier contre roi
    if ((whitePieces.length === 1 && ['B', 'N'].includes(whitePieces[0]) && blackPieces.length === 0) ||
        (blackPieces.length === 1 && ['B', 'N'].includes(blackPieces[0]) && whitePieces.length === 0)) {
      return true;
    }

    // Roi + fou contre roi + fou (même couleur de cases)
    if (whitePieces.length === 1 && blackPieces.length === 1 &&
        whitePieces[0] === 'B' && blackPieces[0] === 'B') {
      // TODO: Vérifier si les fous sont sur la même couleur de cases
      return true;
    }

    return false;
  }

  /**
   * Abandonne la partie
   * @param {string} playerId - ID du joueur qui abandonne
   * @returns {Object} Résultat de l'abandon
   */
  resign(playerId) {
    if (this.status !== 'active') {
      return {
        success: false,
        message: 'La partie n\'est pas active'
      };
    }

    const playerColor = this.getPlayerColor(playerId);
    if (!playerColor) {
      return {
        success: false,
        message: 'Joueur non trouvé dans cette partie'
      };
    }

    const winner = playerColor === 'white' ? GAME_RESULTS.BLACK_WINS : GAME_RESULTS.WHITE_WINS;
    this.endGame(winner, 'resignation');

    return {
      success: true,
      result: this.result,
      reason: this.resultReason
    };
  }

  /**
   * Propose ou accepte une nulle
   * @param {string} playerId - ID du joueur
   * @returns {Object} Résultat de la proposition
   */
  offerDraw(playerId) {
    if (this.status !== 'active') {
      return {
        success: false,
        message: 'La partie n\'est pas active'
      };
    }

    // TODO: Implémenter la logique de proposition de nulle
    this.endGame(GAME_RESULTS.DRAW, 'draw_agreement');

    return {
      success: true,
      result: this.result,
      reason: this.resultReason
    };
  }

  /**
   * Retourne l'état complet de la partie
   * @returns {Object} État de la partie
   */
  getGameState() {
    return {
      id: this.id,
      status: this.status,
      result: this.result,
      resultReason: this.resultReason,
      currentTurn: this.currentTurn,
      moveNumber: this.moveNumber,
      board: this.board.toFEN(),
      players: this.players,
      moves: this.moves,
      stats: this.stats,
      timeControl: this.timeControl,
      increment: this.increment,
      isRanked: this.isRanked,
      startTime: this.startTime,
      endTime: this.endTime || null,
      lastMoveTime: this.lastMoveTime
    };
  }

  /**
   * Retourne la couleur d'un joueur
   * @param {string} playerId - ID du joueur
   * @returns {string|null} Couleur du joueur ou null
   */
  getPlayerColor(playerId) {
    if (this.players.white.id === playerId) return 'white';
    if (this.players.black.id === playerId) return 'black';
    return null;
  }

  /**
   * Génère des pouvoirs aléatoires pour un joueur
   * @returns {Array} Liste des pouvoirs
   */
  generateRandomPowers() {
    const availablePowers = ['teleportation', 'invisibility', 'exchange'];
    const selectedPowers = [];
    
    // Sélectionner 2 pouvoirs aléatoires
    for (let i = 0; i < 2; i++) {
      const randomIndex = Math.floor(Math.random() * availablePowers.length);
      selectedPowers.push({
        name: availablePowers[randomIndex],
        used: false,
        usedAt: null
      });
      availablePowers.splice(randomIndex, 1);
    }
    
    return selectedPowers;
  }

  /**
   * Génère un ID unique pour la partie
   * @returns {string} ID de la partie
   */
  generateGameId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Retourne l'historique des coups en notation PGN
   * @returns {string} Historique PGN
   */
  toPGN() {
    let pgn = '';
    
    for (let i = 0; i < this.moves.length; i += 2) {
      const moveNumber = Math.floor(i / 2) + 1;
      pgn += `${moveNumber}. `;
      
      // Coup des blancs
      if (this.moves[i]) {
        pgn += `${this.moves[i].notation} `;
      }
      
      // Coup des noirs
      if (this.moves[i + 1]) {
        pgn += `${this.moves[i + 1].notation} `;
      }
    }
    
    pgn += this.result;
    return pgn.trim();
  }

  /**
   * Clone la partie pour simulation
   * @returns {Game} Copie de la partie
   */
  clone() {
    const cloned = new Game(this.players.white.id, this.players.black.id, {
      gameId: this.id + '_clone',
      timeControl: this.timeControl,
      increment: this.increment,
      isRanked: false
    });
    
    cloned.board = this.board.clone();
    cloned.validator = new MoveValidator(cloned.board);
    cloned.currentTurn = this.currentTurn;
    cloned.moveNumber = this.moveNumber;
    cloned.moves = [...this.moves];
    
    return cloned;
  }
}

module.exports = Game;