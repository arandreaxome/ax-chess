const Piece = require('../Piece');

/**
 * Classe représentant le Roi (King)
 * Peut se déplacer d'une case dans toutes les directions
 * Possède le mouvement spécial du roque
 */
class King extends Piece {
  constructor(color, rank, file) {
    super('K', color, rank, file);
  }

  /**
   * Valide un mouvement du roi
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est valide
   */
  isValidMove(toRank, toFile, board) {
    const distance = this.getDistance(toRank, toFile);
    
    // Mouvement normal du roi (1 case dans toutes les directions)
    if (distance.total === 1) {
      return true;
    }
    
    // Roque (mouvement de 2 cases horizontalement)
    if (distance.rank === 0 && distance.file === 2) {
      return this.canCastle(toFile > this.file, board);
    }
    
    return false;
  }

  /**
   * Vérifie si le roque est possible
   * @param {boolean} isKingside - True pour petit roque, false pour grand roque
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le roque est possible
   */
  canCastle(isKingside, board) {
    // Le roi ne doit pas avoir bougé
    if (this.hasMoved) {
      return false;
    }

    // Le roi ne doit pas être en échec
    if (board.isKingInCheck(this.color)) {
      return false;
    }

    // Vérifier les droits de roque
    const castlingRights = board.castlingRights[this.color];
    if (isKingside && !castlingRights.kingside) {
      return false;
    }
    if (!isKingside && !castlingRights.queenside) {
      return false;
    }

    // Position de la tour
    const rookFile = isKingside ? 7 : 0;
    const rook = board.getPiece(this.rank, rookFile);
    
    // La tour doit exister et ne pas avoir bougé
    if (!rook || rook.type !== 'R' || rook.color !== this.color || rook.hasMoved) {
      return false;
    }

    // Vérifier que le chemin est libre
    const startFile = Math.min(this.file, rookFile) + 1;
    const endFile = Math.max(this.file, rookFile) - 1;
    
    for (let file = startFile; file <= endFile; file++) {
      if (!board.isEmpty(this.rank, file)) {
        return false;
      }
    }

    // Vérifier que le roi ne passe pas par une case attaquée
    const direction = isKingside ? 1 : -1;
    for (let i = 1; i <= 2; i++) {
      const checkFile = this.file + (i * direction);
      if (board.isSquareAttacked(this.rank, checkFile, this.color === 'white' ? 'black' : 'white')) {
        return false;
      }
    }

    return true;
  }

  /**
   * Retourne tous les mouvements possibles du roi
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements possibles
   */
  getPossibleMoves(board) {
    const moves = [];

    // Mouvements normaux (8 directions)
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [rankOffset, fileOffset] of directions) {
      const toRank = this.rank + rankOffset;
      const toFile = this.file + fileOffset;

      if (this.canMoveTo(toRank, toFile, board)) {
        moves.push({
          fromRank: this.rank,
          fromFile: this.file,
          toRank,
          toFile,
          piece: this,
          capturedPiece: board.getPiece(toRank, toFile)
        });
      }
    }

    // Roques
    if (!this.hasMoved && !board.isKingInCheck(this.color)) {
      // Petit roque
      if (this.canCastle(true, board)) {
        moves.push({
          fromRank: this.rank,
          fromFile: this.file,
          toRank: this.rank,
          toFile: this.file + 2,
          piece: this,
          capturedPiece: null,
          isCastling: true,
          isKingside: true
        });
      }

      // Grand roque
      if (this.canCastle(false, board)) {
        moves.push({
          fromRank: this.rank,
          fromFile: this.file,
          toRank: this.rank,
          toFile: this.file - 2,
          piece: this,
          capturedPiece: null,
          isCastling: true,
          isKingside: false
        });
      }
    }

    return moves;
  }

  /**
   * Vérifie si le roi serait en sécurité après un mouvement
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le roi serait en sécurité
   */
  wouldBeSafe(toRank, toFile, board) {
    // Simuler le mouvement
    const originalRank = this.rank;
    const originalFile = this.file;
    const capturedPiece = board.getPiece(toRank, toFile);

    // Effectuer le mouvement temporairement
    board.setPiece(null, this.rank, this.file);
    board.setPiece(this, toRank, toFile);

    // Vérifier si le roi serait attaqué
    const wouldBeAttacked = board.isSquareAttacked(toRank, toFile, this.color === 'white' ? 'black' : 'white');

    // Annuler le mouvement
    board.setPiece(this, originalRank, originalFile);
    board.setPiece(capturedPiece, toRank, toFile);

    return !wouldBeAttacked;
  }

  /**
   * Retourne les mouvements légaux (qui ne mettent pas le roi en échec)
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements légaux
   */
  getLegalMoves(board) {
    const possibleMoves = this.getPossibleMoves(board);
    const legalMoves = [];

    for (const move of possibleMoves) {
      if (this.wouldBeSafe(move.toRank, move.toFile, board)) {
        legalMoves.push(move);
      }
    }

    return legalMoves;
  }

  /**
   * Vérifie si le roi est en échec et mat
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le roi est en échec et mat
   */
  isCheckmate(board) {
    // Le roi doit être en échec
    if (!board.isKingInCheck(this.color)) {
      return false;
    }

    // Vérifier s'il existe au moins un mouvement légal pour toutes les pièces
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.color === this.color) {
          const legalMoves = piece.getLegalMoves ? piece.getLegalMoves(board) : piece.getPossibleMoves(board);
          if (legalMoves.length > 0) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Vérifie si c'est une situation de pat (stalemate)
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si c'est un pat
   */
  isStalemate(board) {
    // Le roi ne doit pas être en échec
    if (board.isKingInCheck(this.color)) {
      return false;
    }

    // Aucun mouvement légal ne doit être disponible
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.color === this.color) {
          const legalMoves = piece.getLegalMoves ? piece.getLegalMoves(board) : piece.getPossibleMoves(board);
          if (legalMoves.length > 0) {
            return false;
          }
        }
      }
    }

    return true;
  }
}

module.exports = King;