const Piece = require('../Piece');

/**
 * Classe représentant le Pion (Pawn)
 * Peut avancer d'une case, deux cases au premier mouvement, capturer en diagonale
 * Possède les mouvements spéciaux : en passant et promotion
 */
class Pawn extends Piece {
  constructor(color, rank, file) {
    super('P', color, rank, file);
    this.direction = color === 'white' ? 1 : -1; // Direction du mouvement
    this.startRank = color === 'white' ? 1 : 6;  // Rang de départ
    this.promotionRank = color === 'white' ? 7 : 0; // Rang de promotion
  }

  /**
   * Valide un mouvement du pion
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est valide
   */
  isValidMove(toRank, toFile, board) {
    const rankDiff = toRank - this.rank;
    const fileDiff = Math.abs(toFile - this.file);

    // Mouvement vers l'avant uniquement
    if (rankDiff * this.direction <= 0) {
      return false;
    }

    // Mouvement d'une case vers l'avant
    if (rankDiff === this.direction && fileDiff === 0) {
      return board.isEmpty(toRank, toFile);
    }

    // Mouvement de deux cases depuis la position de départ
    if (rankDiff === 2 * this.direction && fileDiff === 0 && !this.hasMoved) {
      return board.isEmpty(this.rank + this.direction, this.file) && 
             board.isEmpty(toRank, toFile);
    }

    // Capture en diagonale
    if (rankDiff === this.direction && fileDiff === 1) {
      const targetPiece = board.getPiece(toRank, toFile);
      
      // Capture normale
      if (targetPiece && targetPiece.color !== this.color) {
        return true;
      }

      // Capture en passant
      if (this.canCaptureEnPassant(toRank, toFile, board)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Vérifie si une capture en passant est possible
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si la capture en passant est possible
   */
  canCaptureEnPassant(toRank, toFile, board) {
    // Vérifier si la case de destination correspond à la cible en passant
    const targetSquare = board.positionToAlgebraic ? 
      board.positionToAlgebraic(toFile, toRank) : 
      String.fromCharCode(97 + toFile) + (toRank + 1);

    if (board.enPassantTarget !== targetSquare) {
      return false;
    }

    // Vérifier qu'il y a un pion adverse à côté
    const adjacentPawn = board.getPiece(this.rank, toFile);
    return adjacentPawn && 
           adjacentPawn.type === 'P' && 
           adjacentPawn.color !== this.color;
  }

  /**
   * Vérifie si le pion peut être promu
   * @param {number} toRank - Rang de destination
   * @returns {boolean} True si promotion possible
   */
  canPromote(toRank) {
    return toRank === this.promotionRank;
  }

  /**
   * Retourne tous les mouvements possibles du pion
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements possibles
   */
  getPossibleMoves(board) {
    const moves = [];

    // Mouvement d'une case vers l'avant
    const oneStepRank = this.rank + this.direction;
    if (board.isValidPosition(oneStepRank, this.file) && board.isEmpty(oneStepRank, this.file)) {
      if (this.canPromote(oneStepRank)) {
        // Ajouter toutes les options de promotion
        for (const promotionPiece of ['Q', 'R', 'B', 'N']) {
          moves.push({
            fromRank: this.rank,
            fromFile: this.file,
            toRank: oneStepRank,
            toFile: this.file,
            piece: this,
            capturedPiece: null,
            isPromotion: true,
            promotionPiece
          });
        }
      } else {
        moves.push({
          fromRank: this.rank,
          fromFile: this.file,
          toRank: oneStepRank,
          toFile: this.file,
          piece: this,
          capturedPiece: null
        });
      }

      // Mouvement de deux cases depuis la position de départ
      const twoStepRank = this.rank + 2 * this.direction;
      if (!this.hasMoved && 
          board.isValidPosition(twoStepRank, this.file) && 
          board.isEmpty(twoStepRank, this.file)) {
        moves.push({
          fromRank: this.rank,
          fromFile: this.file,
          toRank: twoStepRank,
          toFile: this.file,
          piece: this,
          capturedPiece: null,
          isDoubleStep: true
        });
      }
    }

    // Captures en diagonale
    for (const fileOffset of [-1, 1]) {
      const captureFile = this.file + fileOffset;
      const captureRank = this.rank + this.direction;

      if (board.isValidPosition(captureRank, captureFile)) {
        const targetPiece = board.getPiece(captureRank, captureFile);
        
        // Capture normale
        if (targetPiece && targetPiece.color !== this.color) {
          if (this.canPromote(captureRank)) {
            // Promotion avec capture
            for (const promotionPiece of ['Q', 'R', 'B', 'N']) {
              moves.push({
                fromRank: this.rank,
                fromFile: this.file,
                toRank: captureRank,
                toFile: captureFile,
                piece: this,
                capturedPiece: targetPiece,
                isPromotion: true,
                promotionPiece
              });
            }
          } else {
            moves.push({
              fromRank: this.rank,
              fromFile: this.file,
              toRank: captureRank,
              toFile: captureFile,
              piece: this,
              capturedPiece: targetPiece
            });
          }
        }
        // Capture en passant
        else if (this.canCaptureEnPassant(captureRank, captureFile, board)) {
          const capturedPawn = board.getPiece(this.rank, captureFile);
          moves.push({
            fromRank: this.rank,
            fromFile: this.file,
            toRank: captureRank,
            toFile: captureFile,
            piece: this,
            capturedPiece: capturedPawn,
            isEnPassant: true
          });
        }
      }
    }

    return moves;
  }

  /**
   * Vérifie si le pion attaque une case donnée
   * Utilisé pour déterminer si le roi adverse est en échec
   * @param {number} rank - Rang de la case
   * @param {number} file - Colonne de la case
   * @returns {boolean} True si le pion attaque cette case
   */
  attacks(rank, file) {
    const rankDiff = rank - this.rank;
    const fileDiff = Math.abs(file - this.file);
    
    return rankDiff === this.direction && fileDiff === 1;
  }

  /**
   * Retourne les cases attaquées par le pion
   * @returns {Array} Liste des cases attaquées
   */
  getAttackedSquares() {
    const attackedSquares = [];
    const attackRank = this.rank + this.direction;
    
    for (const fileOffset of [-1, 1]) {
      const attackFile = this.file + fileOffset;
      if (attackFile >= 0 && attackFile < 8 && attackRank >= 0 && attackRank < 8) {
        attackedSquares.push({ rank: attackRank, file: attackFile });
      }
    }
    
    return attackedSquares;
  }

  /**
   * Évalue la position du pion
   * @param {Board} board - État de l'échiquier
   * @returns {number} Score d'évaluation
   */
  evaluate(board) {
    let score = this.value;
    
    // Bonus pour l'avancement
    const advancement = this.color === 'white' ? this.rank : 7 - this.rank;
    score += advancement * 0.1;
    
    // Bonus pour les pions passés
    if (this.isPassedPawn(board)) {
      score += 0.5 + advancement * 0.2;
    }
    
    // Malus pour les pions isolés
    if (this.isIsolatedPawn(board)) {
      score -= 0.2;
    }
    
    // Malus pour les pions doublés
    if (this.isDoubledPawn(board)) {
      score -= 0.1;
    }
    
    return score;
  }

  /**
   * Vérifie si c'est un pion passé
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si c'est un pion passé
   */
  isPassedPawn(board) {
    const opponentColor = this.color === 'white' ? 'black' : 'white';
    const checkRanks = this.color === 'white' ? 
      Array.from({length: 8 - this.rank}, (_, i) => this.rank + i + 1) :
      Array.from({length: this.rank}, (_, i) => this.rank - i - 1);
    
    // Vérifier les colonnes adjacentes et la colonne actuelle
    for (const checkFile of [this.file - 1, this.file, this.file + 1]) {
      if (checkFile >= 0 && checkFile < 8) {
        for (const checkRank of checkRanks) {
          const piece = board.getPiece(checkRank, checkFile);
          if (piece && piece.type === 'P' && piece.color === opponentColor) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Vérifie si c'est un pion isolé
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si c'est un pion isolé
   */
  isIsolatedPawn(board) {
    // Vérifier s'il y a des pions alliés sur les colonnes adjacentes
    for (const checkFile of [this.file - 1, this.file + 1]) {
      if (checkFile >= 0 && checkFile < 8) {
        for (let rank = 0; rank < 8; rank++) {
          const piece = board.getPiece(rank, checkFile);
          if (piece && piece.type === 'P' && piece.color === this.color) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Vérifie si c'est un pion doublé
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si c'est un pion doublé
   */
  isDoubledPawn(board) {
    for (let rank = 0; rank < 8; rank++) {
      if (rank !== this.rank) {
        const piece = board.getPiece(rank, this.file);
        if (piece && piece.type === 'P' && piece.color === this.color) {
          return true;
        }
      }
    }
    
    return false;
  }
}

module.exports = Pawn;