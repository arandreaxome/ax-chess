const Piece = require('../Piece');

/**
 * Classe représentant le Cavalier (Knight)
 * Peut se déplacer en forme de L (2+1 ou 1+2 cases)
 * Seule pièce pouvant "sauter" par-dessus les autres
 */
class Knight extends Piece {
  constructor(color, rank, file) {
    super('N', color, rank, file);
  }

  /**
   * Valide un mouvement du cavalier
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est valide
   */
  isValidMove(toRank, toFile, board) {
    const rankDiff = Math.abs(toRank - this.rank);
    const fileDiff = Math.abs(toFile - this.file);

    // Mouvement en L : (2,1) ou (1,2)
    return (rankDiff === 2 && fileDiff === 1) || (rankDiff === 1 && fileDiff === 2);
  }

  /**
   * Retourne tous les mouvements possibles du cavalier
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements possibles
   */
  getPossibleMoves(board) {
    const moves = [];

    // Tous les mouvements possibles en L (8 directions)
    const knightMoves = [
      [-2, -1], [-2, 1], // 2 rangs vers le haut
      [-1, -2], [-1, 2], // 1 rang vers le haut
      [1, -2],  [1, 2],  // 1 rang vers le bas
      [2, -1],  [2, 1]   // 2 rangs vers le bas
    ];

    for (const [rankOffset, fileOffset] of knightMoves) {
      const toRank = this.rank + rankOffset;
      const toFile = this.file + fileOffset;

      // Vérifier si la position est valide
      if (board.isValidPosition(toRank, toFile)) {
        const targetPiece = board.getPiece(toRank, toFile);

        // Case vide ou pièce adverse : mouvement possible
        if (!targetPiece || targetPiece.color !== this.color) {
          moves.push({
            fromRank: this.rank,
            fromFile: this.file,
            toRank,
            toFile,
            piece: this,
            capturedPiece: targetPiece
          });
        }
      }
    }

    return moves;
  }

  /**
   * Vérifie si le cavalier attaque une case donnée
   * @param {number} rank - Rang de la case
   * @param {number} file - Colonne de la case
   * @returns {boolean} True si le cavalier attaque cette case
   */
  attacks(rank, file) {
    const rankDiff = Math.abs(rank - this.rank);
    const fileDiff = Math.abs(file - this.file);
    return (rankDiff === 2 && fileDiff === 1) || (rankDiff === 1 && fileDiff === 2);
  }

  /**
   * Retourne toutes les cases attaquées par le cavalier
   * @returns {Array} Liste des cases attaquées
   */
  getAttackedSquares() {
    const attackedSquares = [];
    const knightMoves = [
      [-2, -1], [-2, 1], [-1, -2], [-1, 2],
      [1, -2], [1, 2], [2, -1], [2, 1]
    ];

    for (const [rankOffset, fileOffset] of knightMoves) {
      const attackRank = this.rank + rankOffset;
      const attackFile = this.file + fileOffset;

      if (attackRank >= 0 && attackRank < 8 && attackFile >= 0 && attackFile < 8) {
        attackedSquares.push({ rank: attackRank, file: attackFile });
      }
    }

    return attackedSquares;
  }

  /**
   * Vérifie si le cavalier est bien développé
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si bien développé
   */
  isWellDeveloped(board) {
    // Un cavalier est bien développé s'il n'est pas sur la première rangée
    const backRank = this.color === 'white' ? 0 : 7;
    
    if (this.rank === backRank) {
      return false;
    }

    // Bonus si le cavalier est centralisé
    const centerDistance = Math.max(
      Math.abs(this.rank - 3.5),
      Math.abs(this.file - 3.5)
    );
    
    return centerDistance <= 2;
  }

  /**
   * Vérifie si le cavalier est sur un avant-poste
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si sur un avant-poste
   */
  isOnOutpost(board) {
    // Un avant-poste est une case avancée protégée par un pion
    // et qui ne peut pas être attaquée par les pions adverses
    
    const opponentColor = this.color === 'white' ? 'black' : 'white';
    const direction = this.color === 'white' ? 1 : -1;
    
    // Vérifier si protégé par un pion allié
    const protectingSquares = [
      [this.rank - direction, this.file - 1],
      [this.rank - direction, this.file + 1]
    ];
    
    let isProtected = false;
    for (const [rank, file] of protectingSquares) {
      if (board.isValidPosition(rank, file)) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.type === 'P' && piece.color === this.color) {
          isProtected = true;
          break;
        }
      }
    }
    
    if (!isProtected) {
      return false;
    }
    
    // Vérifier qu'aucun pion adverse ne peut l'attaquer
    const opponentPawnAttacks = [
      [this.rank + direction, this.file - 1],
      [this.rank + direction, this.file + 1]
    ];
    
    for (const [rank, file] of opponentPawnAttacks) {
      if (board.isValidPosition(rank, file)) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.type === 'P' && piece.color === opponentColor) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * Évalue la position du cavalier
   * @param {Board} board - État de l'échiquier
   * @returns {number} Score d'évaluation
   */
  evaluate(board) {
    let score = this.value;

    // Bonus pour la mobilité
    const possibleMoves = this.getPossibleMoves(board);
    score += possibleMoves.length * 0.1;

    // Bonus pour la centralisation
    const centerDistance = Math.max(
      Math.abs(this.rank - 3.5),
      Math.abs(this.file - 3.5)
    );
    score += (3.5 - centerDistance) * 0.1;

    // Bonus pour le développement
    if (this.isWellDeveloped(board)) {
      score += 0.3;
    }

    // Bonus pour l'avant-poste
    if (this.isOnOutpost(board)) {
      score += 0.5;
    }

    // Malus si sur le bord de l'échiquier
    if (this.isOnEdge()) {
      score -= 0.2;
    }

    // Malus si bloqué
    if (this.isBlocked(board)) {
      score -= 0.3;
    }

    return score;
  }

  /**
   * Vérifie si le cavalier est sur le bord de l'échiquier
   * @returns {boolean} True si sur le bord
   */
  isOnEdge() {
    return this.rank === 0 || this.rank === 7 || this.file === 0 || this.file === 7;
  }

  /**
   * Vérifie si le cavalier est bloqué (peu de mobilité)
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si bloqué
   */
  isBlocked(board) {
    const possibleMoves = this.getPossibleMoves(board);
    return possibleMoves.length <= 2;
  }

  /**
   * Trouve les meilleures fourchettes possibles
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

      // Compter les cibles menacées depuis cette position
      for (const target of targets) {
        if (this.attacks(target.rank, target.file)) {
          threatenedTargets++;
          threatenedPieces.push(target.piece);
        }
      }

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

  /**
   * Calcule le score de contrôle du centre
   * @returns {number} Score de contrôle du centre
   */
  getCenterControlScore() {
    const centerSquares = [
      [3, 3], [3, 4], [4, 3], [4, 4] // d4, e4, d5, e5
    ];
    
    let controlScore = 0;
    for (const [rank, file] of centerSquares) {
      if (this.attacks(rank, file)) {
        controlScore += 0.2;
      }
    }
    
    return controlScore;
  }

  /**
   * Vérifie si le cavalier peut effectuer une découverte
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des découvertes possibles
   */
  getPossibleDiscoveries(board) {
    const discoveries = [];
    
    // Chercher les pièces alliées à longue portée
    const longRangePieces = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.color === this.color && 
            (piece.type === 'Q' || piece.type === 'R' || piece.type === 'B')) {
          longRangePieces.push(piece);
        }
      }
    }

    // Vérifier si le cavalier bloque une ligne d'attaque
    for (const piece of longRangePieces) {
      const possibleMoves = this.getPossibleMoves(board);
      for (const move of possibleMoves) {
        // Simuler le mouvement du cavalier
        const originalRank = this.rank;
        const originalFile = this.file;
        this.rank = move.toRank;
        this.file = move.toFile;

        // Vérifier si la pièce à longue portée peut maintenant attaquer
        const attackedSquares = piece.getAttackedSquares(board);
        let discoveryValue = 0;

        for (const square of attackedSquares) {
          const targetPiece = board.getPiece(square.rank, square.file);
          if (targetPiece && targetPiece.color !== this.color) {
            discoveryValue += targetPiece.value;
          }
        }

        // Restaurer la position
        this.rank = originalRank;
        this.file = originalFile;

        if (discoveryValue > 0) {
          discoveries.push({
            move,
            discoveryPiece: piece,
            value: discoveryValue
          });
        }
      }
    }

    return discoveries.sort((a, b) => b.value - a.value);
  }

  /**
   * Trouve les meilleures cases pour le cavalier
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des meilleures cases
   */
  getBestSquares(board) {
    const bestSquares = [];
    const possibleMoves = this.getPossibleMoves(board);

    for (const move of possibleMoves) {
      let score = 0;

      // Simuler le mouvement
      const originalRank = this.rank;
      const originalFile = this.file;
      this.rank = move.toRank;
      this.file = move.toFile;

      // Évaluer la position
      score += this.evaluate(board);
      score += this.getCenterControlScore();

      // Bonus pour les fourchettes potentielles
      const forks = this.getPossibleForks(board);
      if (forks.length > 0) {
        score += forks[0].value * 0.3;
      }

      // Restaurer la position
      this.rank = originalRank;
      this.file = originalFile;

      bestSquares.push({
        move,
        score
      });
    }

    return bestSquares.sort((a, b) => b.score - a.score);
  }
}

module.exports = Knight;