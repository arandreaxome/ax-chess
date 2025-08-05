const { positionToAlgebraic } = require('../../../shared/constants/chess-notation');

/**
 * Classe abstraite de base pour toutes les pièces d'échecs
 * Utilise la notation algébrique anglaise (K, Q, R, B, N, P)
 */
class Piece {
  /**
   * @param {string} type - Type de pièce (K, Q, R, B, N, P)
   * @param {string} color - Couleur ('white' ou 'black')
   * @param {number} rank - Rang initial (0-7)
   * @param {number} file - Colonne initiale (0-7)
   */
  constructor(type, color, rank, file) {
    if (this.constructor === Piece) {
      throw new Error('Piece est une classe abstraite et ne peut pas être instanciée directement');
    }

    this.type = type;
    this.color = color;
    this.rank = rank;
    this.file = file;
    this.hasMoved = false;
    this.value = this.getPieceValue();
  }

  /**
   * Retourne la valeur de la pièce (pour l'évaluation)
   * @returns {number} Valeur de la pièce
   */
  getPieceValue() {
    const values = {
      'P': 1,   // Pion
      'N': 3,   // Cavalier
      'B': 3,   // Fou
      'R': 5,   // Tour
      'Q': 9,   // Dame
      'K': 0    // Roi (valeur infinie)
    };
    return values[this.type] || 0;
  }

  /**
   * Retourne la position actuelle en notation algébrique
   * @returns {string} Position (ex: 'e4')
   */
  getPosition() {
    return positionToAlgebraic(this.file, this.rank);
  }

  /**
   * Vérifie si la pièce peut se déplacer vers une position
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est possible
   */
  canMoveTo(toRank, toFile, board) {
    // Vérifications de base
    if (!board.isValidPosition(toRank, toFile)) {
      return false;
    }

    // Ne peut pas capturer ses propres pièces
    if (board.isOccupiedBy(toRank, toFile, this.color)) {
      return false;
    }

    // Vérification spécifique à chaque type de pièce
    return this.isValidMove(toRank, toFile, board);
  }

  /**
   * Méthode abstraite pour valider un mouvement spécifique à chaque pièce
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est valide pour cette pièce
   */
  isValidMove(toRank, toFile, board) {
    throw new Error('isValidMove doit être implémentée par chaque classe de pièce');
  }

  /**
   * Retourne tous les mouvements possibles pour cette pièce
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements possibles
   */
  getPossibleMoves(board) {
    const moves = [];
    
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        if (this.canMoveTo(rank, file, board)) {
          moves.push({
            fromRank: this.rank,
            fromFile: this.file,
            toRank: rank,
            toFile: file,
            piece: this,
            capturedPiece: board.getPiece(rank, file)
          });
        }
      }
    }

    return moves;
  }

  /**
   * Vérifie si le chemin entre deux positions est libre
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le chemin est libre
   */
  isPathClear(toRank, toFile, board) {
    const rankDiff = toRank - this.rank;
    const fileDiff = toFile - this.file;
    
    // Calculer la direction du mouvement
    const rankStep = rankDiff === 0 ? 0 : rankDiff / Math.abs(rankDiff);
    const fileStep = fileDiff === 0 ? 0 : fileDiff / Math.abs(fileDiff);
    
    // Vérifier chaque case intermédiaire
    let currentRank = this.rank + rankStep;
    let currentFile = this.file + fileStep;
    
    while (currentRank !== toRank || currentFile !== toFile) {
      if (!board.isEmpty(currentRank, currentFile)) {
        return false;
      }
      currentRank += rankStep;
      currentFile += fileStep;
    }
    
    return true;
  }

  /**
   * Vérifie si un mouvement est en diagonale
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @returns {boolean} True si le mouvement est diagonal
   */
  isDiagonalMove(toRank, toFile) {
    const rankDiff = Math.abs(toRank - this.rank);
    const fileDiff = Math.abs(toFile - this.file);
    return rankDiff === fileDiff && rankDiff > 0;
  }

  /**
   * Vérifie si un mouvement est horizontal ou vertical
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @returns {boolean} True si le mouvement est horizontal/vertical
   */
  isStraightMove(toRank, toFile) {
    return (toRank === this.rank && toFile !== this.file) || 
           (toFile === this.file && toRank !== this.rank);
  }

  /**
   * Calcule la distance entre la position actuelle et une destination
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @returns {Object} Distance {rank, file, total}
   */
  getDistance(toRank, toFile) {
    const rankDistance = Math.abs(toRank - this.rank);
    const fileDistance = Math.abs(toFile - this.file);
    return {
      rank: rankDistance,
      file: fileDistance,
      total: Math.max(rankDistance, fileDistance)
    };
  }

  /**
   * Clone la pièce pour les simulations
   * @returns {Piece} Copie de la pièce
   */
  clone() {
    const ClonedClass = this.constructor;
    const cloned = new ClonedClass(this.color, this.rank, this.file);
    cloned.hasMoved = this.hasMoved;
    return cloned;
  }

  /**
   * Représentation textuelle de la pièce
   * @returns {string} Représentation de la pièce
   */
  toString() {
    const symbol = this.color === 'white' ? this.type : this.type.toLowerCase();
    return `${symbol}${this.getPosition()}`;
  }

  /**
   * Vérifie l'égalité avec une autre pièce
   * @param {Piece} other - Autre pièce
   * @returns {boolean} True si les pièces sont identiques
   */
  equals(other) {
    return other instanceof Piece &&
           this.type === other.type &&
           this.color === other.color &&
           this.rank === other.rank &&
           this.file === other.file;
  }

  /**
   * Retourne une représentation JSON de la pièce
   * @returns {Object} Objet JSON
   */
  toJSON() {
    return {
      type: this.type,
      color: this.color,
      rank: this.rank,
      file: this.file,
      position: this.getPosition(),
      hasMoved: this.hasMoved,
      value: this.value
    };
  }
}

module.exports = Piece;