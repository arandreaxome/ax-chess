const Piece = require('../Piece');

/**
 * Classe représentant la Dame (Queen)
 * Peut se déplacer horizontalement, verticalement et en diagonale
 * Combine les mouvements de la tour et du fou
 */
class Queen extends Piece {
  constructor(color, rank, file) {
    super('Q', color, rank, file);
  }

  /**
   * Valide un mouvement de la dame
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est valide
   */
  isValidMove(toRank, toFile, board) {
    // La dame peut se déplacer en ligne droite ou en diagonale
    const isValidDirection = this.isStraightMove(toRank, toFile) || this.isDiagonalMove(toRank, toFile);
    
    if (!isValidDirection) {
      return false;
    }

    // Vérifier que le chemin est libre
    return this.isPathClear(toRank, toFile, board);
  }

  /**
   * Retourne tous les mouvements possibles de la dame
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements possibles
   */
  getPossibleMoves(board) {
    const moves = [];

    // Directions : horizontale, verticale et diagonales (8 directions)
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],  // Nord-Ouest, Nord, Nord-Est
      [0, -1],           [0, 1],   // Ouest, Est
      [1, -1],  [1, 0],  [1, 1]    // Sud-Ouest, Sud, Sud-Est
    ];

    for (const [rankDirection, fileDirection] of directions) {
      // Explorer dans chaque direction jusqu'à rencontrer un obstacle
      for (let distance = 1; distance < 8; distance++) {
        const toRank = this.rank + (rankDirection * distance);
        const toFile = this.file + (fileDirection * distance);

        // Vérifier si la position est valide
        if (!board.isValidPosition(toRank, toFile)) {
          break;
        }

        const targetPiece = board.getPiece(toRank, toFile);

        // Case vide : mouvement possible, continuer dans cette direction
        if (!targetPiece) {
          moves.push({
            fromRank: this.rank,
            fromFile: this.file,
            toRank,
            toFile,
            piece: this,
            capturedPiece: null
          });
        }
        // Pièce adverse : capture possible, arrêter dans cette direction
        else if (targetPiece.color !== this.color) {
          moves.push({
            fromRank: this.rank,
            fromFile: this.file,
            toRank,
            toFile,
            piece: this,
            capturedPiece: targetPiece
          });
          break;
        }
        // Pièce alliée : arrêter dans cette direction
        else {
          break;
        }
      }
    }

    return moves;
  }

  /**
   * Vérifie si la dame attaque une case donnée
   * @param {number} rank - Rang de la case
   * @param {number} file - Colonne de la case
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si la dame attaque cette case
   */
  attacks(rank, file, board) {
    // Vérifier si c'est dans une direction valide
    if (!this.isStraightMove(rank, file) && !this.isDiagonalMove(rank, file)) {
      return false;
    }

    // Vérifier que le chemin est libre
    return this.isPathClear(rank, file, board);
  }

  /**
   * Retourne toutes les cases attaquées par la dame
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des cases attaquées
   */
  getAttackedSquares(board) {
    const attackedSquares = [];
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];

    for (const [rankDirection, fileDirection] of directions) {
      for (let distance = 1; distance < 8; distance++) {
        const attackRank = this.rank + (rankDirection * distance);
        const attackFile = this.file + (fileDirection * distance);

        if (!board.isValidPosition(attackRank, attackFile)) {
          break;
        }

        attackedSquares.push({ rank: attackRank, file: attackFile });

        // Si on rencontre une pièce, on s'arrête
        if (board.getPiece(attackRank, attackFile)) {
          break;
        }
      }
    }

    return attackedSquares;
  }

  /**
   * Évalue la position de la dame
   * @param {Board} board - État de l'échiquier
   * @returns {number} Score d'évaluation
   */
  evaluate(board) {
    let score = this.value;

    // Bonus pour la mobilité (nombre de cases attaquées)
    const attackedSquares = this.getAttackedSquares(board);
    score += attackedSquares.length * 0.1;

    // Bonus pour la position centrale
    const centerDistance = Math.max(
      Math.abs(this.rank - 3.5),
      Math.abs(this.file - 3.5)
    );
    score += (3.5 - centerDistance) * 0.1;

    // Malus si la dame sort trop tôt (développement prématuré)
    if (this.hasMoved && this.isEarlyDevelopment(board)) {
      score -= 0.5;
    }

    return score;
  }

  /**
   * Vérifie si la dame est développée trop tôt
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si développement prématuré
   */
  isEarlyDevelopment(board) {
    // Compter les pièces mineures développées
    let minorPiecesDeveloped = 0;
    const backRank = this.color === 'white' ? 0 : 7;

    for (let file = 0; file < 8; file++) {
      const piece = board.getPiece(backRank, file);
      if (piece && piece.color === this.color && 
          (piece.type === 'N' || piece.type === 'B') && piece.hasMoved) {
        minorPiecesDeveloped++;
      }
    }

    // La dame ne devrait pas sortir avant au moins 2 pièces mineures
    return minorPiecesDeveloped < 2;
  }

  /**
   * Vérifie si la dame peut effectuer une fourchette
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des fourchettes possibles
   */
  getPossibleForks(board) {
    const forks = [];
    const opponentColor = this.color === 'white' ? 'black' : 'white';

    // Récupérer toutes les pièces adverses importantes
    const targets = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.color === opponentColor && 
            (piece.type === 'K' || piece.value >= 3)) {
          targets.push({ piece, rank, file });
        }
      }
    }

    // Vérifier chaque mouvement possible
    const possibleMoves = this.getPossibleMoves(board);
    for (const move of possibleMoves) {
      let threatenedTargets = 0;
      const threatenedPieces = [];

      // Simuler le mouvement
      const originalRank = this.rank;
      const originalFile = this.file;
      this.rank = move.toRank;
      this.file = move.toFile;

      // Compter les cibles menacées depuis cette position
      for (const target of targets) {
        if (this.attacks(target.rank, target.file, board)) {
          threatenedTargets++;
          threatenedPieces.push(target.piece);
        }
      }

      // Restaurer la position
      this.rank = originalRank;
      this.file = originalFile;

      // Si au moins 2 pièces sont menacées, c'est une fourchette
      if (threatenedTargets >= 2) {
        forks.push({
          move,
          threatenedPieces,
          value: threatenedPieces.reduce((sum, piece) => sum + piece.value, 0)
        });
      }
    }

    return forks.sort((a, b) => b.value - a.value);
  }
}

module.exports = Queen;