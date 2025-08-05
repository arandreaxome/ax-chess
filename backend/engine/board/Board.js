const { FILES, RANKS, positionToAlgebraic, algebraicToPosition } = require('../../../shared/constants/chess-notation');
const Piece = require('./Piece');
const King = require('./pieces/King');
const Queen = require('./pieces/Queen');
const Rook = require('./pieces/Rook');
const Bishop = require('./pieces/Bishop');
const Knight = require('./pieces/Knight');
const Pawn = require('./pieces/Pawn');

/**
 * Classe représentant l'échiquier d'échecs
 * Utilise la notation algébrique anglaise (a1-h8)
 */
class Board {
  constructor() {
    // Échiquier 8x8 - [rang][colonne]
    // Rang 0 = rang 1 (blanc), Rang 7 = rang 8 (noir)
    this.squares = Array(8).fill(null).map(() => Array(8).fill(null));
    
    // Historique des positions pour détecter les répétitions
    this.positionHistory = [];
    
    // États spéciaux
    this.castlingRights = {
      white: { kingside: true, queenside: true },
      black: { kingside: true, queenside: true }
    };
    
    this.enPassantTarget = null; // Case cible pour en passant
    this.halfMoveClock = 0; // Compteur pour la règle des 50 coups
    this.fullMoveNumber = 1; // Numéro du coup complet
    
    this.initializeBoard();
  }

  /**
   * Initialise l'échiquier avec la position de départ standard
   */
  initializeBoard() {
    // Pièces noires (rang 8 et 7)
    this.squares[7] = [
      new Rook('black', 7, 0),
      new Knight('black', 7, 1),
      new Bishop('black', 7, 2),
      new Queen('black', 7, 3),
      new King('black', 7, 4),
      new Bishop('black', 7, 5),
      new Knight('black', 7, 6),
      new Rook('black', 7, 7)
    ];
    
    for (let file = 0; file < 8; file++) {
      this.squares[6][file] = new Pawn('black', 6, file);
    }

    // Cases vides (rangs 6, 5, 4, 3)
    for (let rank = 2; rank < 6; rank++) {
      for (let file = 0; file < 8; file++) {
        this.squares[rank][file] = null;
      }
    }

    // Pions blancs (rang 2)
    for (let file = 0; file < 8; file++) {
      this.squares[1][file] = new Pawn('white', 1, file);
    }

    // Pièces blanches (rang 1)
    this.squares[0] = [
      new Rook('white', 0, 0),
      new Knight('white', 0, 1),
      new Bishop('white', 0, 2),
      new Queen('white', 0, 3),
      new King('white', 0, 4),
      new Bishop('white', 0, 5),
      new Knight('white', 0, 6),
      new Rook('white', 0, 7)
    ];
  }

  /**
   * Récupère une pièce à une position donnée
   * @param {number|string} rank - Rang (0-7) ou notation algébrique (ex: 'e4')
   * @param {number} file - Colonne (0-7), optionnel si rank est algébrique
   * @returns {Piece|null} La pièce à cette position ou null
   */
  getPiece(rank, file) {
    if (typeof rank === 'string') {
      const pos = algebraicToPosition(rank);
      return this.squares[pos.rank][pos.file];
    }
    return this.squares[rank][file];
  }

  /**
   * Place une pièce à une position donnée
   * @param {Piece} piece - La pièce à placer
   * @param {number|string} rank - Rang ou notation algébrique
   * @param {number} file - Colonne, optionnel si rank est algébrique
   */
  setPiece(piece, rank, file) {
    if (typeof rank === 'string') {
      const pos = algebraicToPosition(rank);
      this.squares[pos.rank][pos.file] = piece;
      if (piece) {
        piece.rank = pos.rank;
        piece.file = pos.file;
      }
    } else {
      this.squares[rank][file] = piece;
      if (piece) {
        piece.rank = rank;
        piece.file = file;
      }
    }
  }

  /**
   * Supprime une pièce d'une position
   * @param {number|string} rank - Rang ou notation algébrique
   * @param {number} file - Colonne, optionnel si rank est algébrique
   * @returns {Piece|null} La pièce supprimée ou null
   */
  removePiece(rank, file) {
    const piece = this.getPiece(rank, file);
    this.setPiece(null, rank, file);
    return piece;
  }

  /**
   * Vérifie si une case est vide
   * @param {number|string} rank - Rang ou notation algébrique
   * @param {number} file - Colonne, optionnel si rank est algébrique
   * @returns {boolean} True si la case est vide
   */
  isEmpty(rank, file) {
    return this.getPiece(rank, file) === null;
  }

  /**
   * Vérifie si une case est occupée par une pièce d'une couleur donnée
   * @param {number|string} rank - Rang ou notation algébrique
   * @param {number} file - Colonne, optionnel si rank est algébrique
   * @param {string} color - Couleur ('white' ou 'black')
   * @returns {boolean} True si occupée par cette couleur
   */
  isOccupiedBy(rank, file, color) {
    const piece = this.getPiece(rank, file);
    return piece !== null && piece.color === color;
  }

  /**
   * Vérifie si une position est dans les limites de l'échiquier
   * @param {number} rank - Rang (0-7)
   * @param {number} file - Colonne (0-7)
   * @returns {boolean} True si la position est valide
   */
  isValidPosition(rank, file) {
    return rank >= 0 && rank < 8 && file >= 0 && file < 8;
  }

  /**
   * Trouve le roi d'une couleur donnée
   * @param {string} color - Couleur du roi ('white' ou 'black')
   * @returns {Object|null} Position du roi {rank, file} ou null
   */
  findKing(color) {
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.squares[rank][file];
        if (piece && piece.type === 'K' && piece.color === color) {
          return { rank, file };
        }
      }
    }
    return null;
  }

  /**
   * Vérifie si un roi est en échec
   * @param {string} color - Couleur du roi
   * @returns {boolean} True si le roi est en échec
   */
  isKingInCheck(color) {
    const kingPos = this.findKing(color);
    if (!kingPos) return false;

    return this.isSquareAttacked(kingPos.rank, kingPos.file, color === 'white' ? 'black' : 'white');
  }

  /**
   * Vérifie si une case est attaquée par une couleur donnée
   * @param {number} rank - Rang de la case
   * @param {number} file - Colonne de la case
   * @param {string} attackingColor - Couleur qui attaque
   * @returns {boolean} True si la case est attaquée
   */
  isSquareAttacked(rank, file, attackingColor) {
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = this.squares[r][f];
        if (piece && piece.color === attackingColor) {
          const moves = piece.getPossibleMoves(this);
          if (moves.some(move => move.toRank === rank && move.toFile === file)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Exécute un mouvement sur l'échiquier
   * @param {Object} move - Objet décrivant le mouvement
   * @returns {Object} Informations sur le mouvement exécuté
   */
  makeMove(move) {
    const { fromRank, fromFile, toRank, toFile, promotion } = move;
    
    const piece = this.getPiece(fromRank, fromFile);
    const capturedPiece = this.getPiece(toRank, toFile);
    
    if (!piece) {
      throw new Error('Aucune pièce à la position de départ');
    }

    // Sauvegarder l'état pour pouvoir annuler
    const moveInfo = {
      piece,
      capturedPiece,
      fromRank,
      fromFile,
      toRank,
      toFile,
      castlingRights: { ...this.castlingRights },
      enPassantTarget: this.enPassantTarget,
      halfMoveClock: this.halfMoveClock
    };

    // Déplacer la pièce
    this.removePiece(fromRank, fromFile);
    this.setPiece(piece, toRank, toFile);

    // Gestion des règles spéciales
    this.handleSpecialMoves(move, moveInfo);

    // Mettre à jour les compteurs
    this.updateCounters(piece, capturedPiece);

    // Marquer la pièce comme ayant bougé
    piece.hasMoved = true;

    return moveInfo;
  }

  /**
   * Gère les mouvements spéciaux (roque, en passant, promotion)
   * @param {Object} move - Le mouvement
   * @param {Object} moveInfo - Informations sur le mouvement
   */
  handleSpecialMoves(move, moveInfo) {
    const { piece, fromRank, fromFile, toRank, toFile } = moveInfo;

    // Roque
    if (piece.type === 'K' && Math.abs(toFile - fromFile) === 2) {
      const isKingside = toFile > fromFile;
      const rookFromFile = isKingside ? 7 : 0;
      const rookToFile = isKingside ? 5 : 3;
      
      const rook = this.removePiece(fromRank, rookFromFile);
      this.setPiece(rook, fromRank, rookToFile);
      
      moveInfo.isCastling = true;
      moveInfo.rookMove = { fromFile: rookFromFile, toFile: rookToFile };
    }

    // En passant
    if (piece.type === 'P' && toFile !== fromFile && !moveInfo.capturedPiece) {
      const capturedPawn = this.removePiece(fromRank, toFile);
      moveInfo.capturedPiece = capturedPawn;
      moveInfo.isEnPassant = true;
    }

    // Promotion
    if (piece.type === 'P' && (toRank === 0 || toRank === 7)) {
      const promotionType = move.promotion || 'Q';
      const promotedPiece = this.createPiece(promotionType, piece.color, toRank, toFile);
      this.setPiece(promotedPiece, toRank, toFile);
      moveInfo.isPromotion = true;
      moveInfo.promotionPiece = promotedPiece;
    }

    // Mise à jour des droits de roque
    this.updateCastlingRights(piece, fromRank, fromFile, toRank, toFile);

    // Mise à jour de la cible en passant
    this.updateEnPassantTarget(piece, fromRank, toRank, fromFile);
  }

  /**
   * Met à jour les droits de roque
   */
  updateCastlingRights(piece, fromRank, fromFile, toRank, toFile) {
    // Si le roi bouge
    if (piece.type === 'K') {
      this.castlingRights[piece.color].kingside = false;
      this.castlingRights[piece.color].queenside = false;
    }

    // Si une tour bouge
    if (piece.type === 'R') {
      if (fromFile === 0) {
        this.castlingRights[piece.color].queenside = false;
      } else if (fromFile === 7) {
        this.castlingRights[piece.color].kingside = false;
      }
    }

    // Si une tour est capturée
    if (toRank === 0 || toRank === 7) {
      const color = toRank === 0 ? 'white' : 'black';
      if (toFile === 0) {
        this.castlingRights[color].queenside = false;
      } else if (toFile === 7) {
        this.castlingRights[color].kingside = false;
      }
    }
  }

  /**
   * Met à jour la cible en passant
   */
  updateEnPassantTarget(piece, fromRank, toRank, fromFile) {
    if (piece.type === 'P' && Math.abs(toRank - fromRank) === 2) {
      const targetRank = (fromRank + toRank) / 2;
      this.enPassantTarget = positionToAlgebraic(fromFile, targetRank);
    } else {
      this.enPassantTarget = null;
    }
  }

  /**
   * Met à jour les compteurs de coups
   */
  updateCounters(piece, capturedPiece) {
    if (piece.type === 'P' || capturedPiece) {
      this.halfMoveClock = 0;
    } else {
      this.halfMoveClock++;
    }

    if (piece.color === 'black') {
      this.fullMoveNumber++;
    }
  }

  /**
   * Crée une nouvelle pièce du type spécifié
   * @param {string} type - Type de pièce (K, Q, R, B, N, P)
   * @param {string} color - Couleur
   * @param {number} rank - Rang
   * @param {number} file - Colonne
   * @returns {Piece} La nouvelle pièce
   */
  createPiece(type, color, rank, file) {
    switch (type) {
      case 'K': return new King(color, rank, file);
      case 'Q': return new Queen(color, rank, file);
      case 'R': return new Rook(color, rank, file);
      case 'B': return new Bishop(color, rank, file);
      case 'N': return new Knight(color, rank, file);
      case 'P': return new Pawn(color, rank, file);
      default: throw new Error(`Type de pièce inconnu: ${type}`);
    }
  }

  /**
   * Génère la notation FEN de la position actuelle
   * @returns {string} Notation FEN
   */
  toFEN() {
    let fen = '';
    
    // Position des pièces
    for (let rank = 7; rank >= 0; rank--) {
      let emptyCount = 0;
      for (let file = 0; file < 8; file++) {
        const piece = this.squares[rank][file];
        if (piece) {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += piece.color === 'white' ? piece.type : piece.type.toLowerCase();
        } else {
          emptyCount++;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (rank > 0) {
        fen += '/';
      }
    }

    // TODO: Ajouter les autres parties de la notation FEN
    // (tour actuel, droits de roque, en passant, compteurs)
    
    return fen;
  }

  /**
   * Clone l'échiquier pour les simulations
   * @returns {Board} Copie de l'échiquier
   */
  clone() {
    const cloned = new Board();
    
    // Copier l'échiquier
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.squares[rank][file];
        if (piece) {
          cloned.squares[rank][file] = piece.clone();
        }
      }
    }

    // Copier les états
    cloned.castlingRights = JSON.parse(JSON.stringify(this.castlingRights));
    cloned.enPassantTarget = this.enPassantTarget;
    cloned.halfMoveClock = this.halfMoveClock;
    cloned.fullMoveNumber = this.fullMoveNumber;

    return cloned;
  }
}

module.exports = Board;