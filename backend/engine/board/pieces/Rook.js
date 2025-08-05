const Piece = require('../Piece');

/**
 * Classe représentant la Tour (Rook)
 * Peut se déplacer horizontalement et verticalement
 */
class Rook extends Piece {
  constructor(color, rank, file) {
    super('R', color, rank, file);
  }

  /**
   * Valide un mouvement de la tour
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est valide
   */
  isValidMove(toRank, toFile, board) {
    // La tour ne peut se déplacer qu'horizontalement ou verticalement
    if (!this.isStraightMove(toRank, toFile)) {
      return false;
    }

    // Vérifier que le chemin est libre
    return this.isPathClear(toRank, toFile, board);
  }

  /**
   * Retourne tous les mouvements possibles de la tour
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements possibles
   */
  getPossibleMoves(board) {
    const moves = [];

    // Directions : horizontale et verticale (4 directions)
    const directions = [
      [-1, 0], // Nord
      [1, 0],  // Sud
      [0, -1], // Ouest
      [0, 1]   // Est
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
   * Vérifie si la tour attaque une case donnée
   * @param {number} rank - Rang de la case
   * @param {number} file - Colonne de la case
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si la tour attaque cette case
   */
  attacks(rank, file, board) {
    // Vérifier si c'est dans une direction valide (horizontale/verticale)
    if (!this.isStraightMove(rank, file)) {
      return false;
    }

    // Vérifier que le chemin est libre
    return this.isPathClear(rank, file, board);
  }

  /**
   * Retourne toutes les cases attaquées par la tour
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des cases attaquées
   */
  getAttackedSquares(board) {
    const attackedSquares = [];
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
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
   * Vérifie si la tour est sur une colonne ouverte
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si sur colonne ouverte
   */
  isOnOpenFile(board) {
    // Vérifier s'il y a des pions sur cette colonne
    for (let rank = 0; rank < 8; rank++) {
      const piece = board.getPiece(rank, this.file);
      if (piece && piece.type === 'P') {
        return false;
      }
    }
    return true;
  }

  /**
   * Vérifie si la tour est sur une colonne semi-ouverte
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si sur colonne semi-ouverte
   */
  isOnSemiOpenFile(board) {
    let hasOwnPawn = false;
    let hasOpponentPawn = false;

    for (let rank = 0; rank < 8; rank++) {
      const piece = board.getPiece(rank, this.file);
      if (piece && piece.type === 'P') {
        if (piece.color === this.color) {
          hasOwnPawn = true;
        } else {
          hasOpponentPawn = true;
        }
      }
    }

    // Semi-ouverte si pas de pion allié mais pion adverse
    return !hasOwnPawn && hasOpponentPawn;
  }

  /**
   * Vérifie si la tour est sur la 7ème rangée (ou 2ème pour les noires)
   * @returns {boolean} True si sur la 7ème rangée
   */
  isOnSeventhRank() {
    const seventhRank = this.color === 'white' ? 6 : 1;
    return this.rank === seventhRank;
  }

  /**
   * Évalue la position de la tour
   * @param {Board} board - État de l'échiquier
   * @returns {number} Score d'évaluation
   */
  evaluate(board) {
    let score = this.value;

    // Bonus pour la mobilité
    const attackedSquares = this.getAttackedSquares(board);
    score += attackedSquares.length * 0.05;

    // Bonus pour colonne ouverte
    if (this.isOnOpenFile(board)) {
      score += 0.5;
    }
    // Bonus moindre pour colonne semi-ouverte
    else if (this.isOnSemiOpenFile(board)) {
      score += 0.25;
    }

    // Bonus pour la 7ème rangée
    if (this.isOnSeventhRank()) {
      score += 0.3;
    }

    // Bonus pour les tours connectées
    if (this.isConnectedToOtherRook(board)) {
      score += 0.2;
    }

    // Malus si la tour est inactive
    if (this.isInactive(board)) {
      score -= 0.3;
    }

    return score;
  }

  /**
   * Vérifie si la tour est connectée à l'autre tour
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si connectée
   */
  isConnectedToOtherRook(board) {
    // Chercher l'autre tour de la même couleur
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.type === 'R' && piece.color === this.color && 
            (piece.rank !== this.rank || piece.file !== this.file)) {
          
          // Vérifier si elles sont sur la même rangée ou colonne
          if (piece.rank === this.rank || piece.file === this.file) {
            // Vérifier si le chemin est libre
            return this.isPathClear(piece.rank, piece.file, board);
          }
        }
      }
    }
    return false;
  }

  /**
   * Vérifie si la tour est inactive
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si inactive
   */
  isInactive(board) {
    // Une tour est considérée inactive si elle a peu de mobilité
    const possibleMoves = this.getPossibleMoves(board);
    return possibleMoves.length < 3;
  }

  /**
   * Trouve les cibles potentielles pour une attaque
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des cibles potentielles
   */
  getPotentialTargets(board) {
    const targets = [];
    const opponentColor = this.color === 'white' ? 'black' : 'white';

    // Vérifier les rangées et colonnes
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1]
    ];

    for (const [rankDirection, fileDirection] of directions) {
      for (let distance = 1; distance < 8; distance++) {
        const targetRank = this.rank + (rankDirection * distance);
        const targetFile = this.file + (fileDirection * distance);

        if (!board.isValidPosition(targetRank, targetFile)) {
          break;
        }

        const piece = board.getPiece(targetRank, targetFile);
        if (piece) {
          if (piece.color === opponentColor) {
            targets.push({
              piece,
              rank: targetRank,
              file: targetFile,
              distance
            });
          }
          break; // Arrêter dans cette direction
        }
      }
    }

    return targets.sort((a, b) => b.piece.value - a.piece.value);
  }
}

module.exports = Rook;