const Piece = require('../Piece');

/**
 * Classe représentant le Fou (Bishop)
 * Peut se déplacer uniquement en diagonale
 */
class Bishop extends Piece {
  constructor(color, rank, file) {
    super('B', color, rank, file);
    // Déterminer la couleur des cases (claire ou foncée)
    this.squareColor = (rank + file) % 2 === 0 ? 'dark' : 'light';
  }

  /**
   * Valide un mouvement du fou
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le mouvement est valide
   */
  isValidMove(toRank, toFile, board) {
    // Le fou ne peut se déplacer qu'en diagonale
    if (!this.isDiagonalMove(toRank, toFile)) {
      return false;
    }

    // Vérifier que le chemin est libre
    return this.isPathClear(toRank, toFile, board);
  }

  /**
   * Retourne tous les mouvements possibles du fou
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des mouvements possibles
   */
  getPossibleMoves(board) {
    const moves = [];

    // Directions diagonales (4 directions)
    const directions = [
      [-1, -1], // Nord-Ouest
      [-1, 1],  // Nord-Est
      [1, -1],  // Sud-Ouest
      [1, 1]    // Sud-Est
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
   * Vérifie si le fou attaque une case donnée
   * @param {number} rank - Rang de la case
   * @param {number} file - Colonne de la case
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si le fou attaque cette case
   */
  attacks(rank, file, board) {
    // Vérifier si c'est dans une direction diagonale valide
    if (!this.isDiagonalMove(rank, file)) {
      return false;
    }

    // Vérifier que le chemin est libre
    return this.isPathClear(rank, file, board);
  }

  /**
   * Retourne toutes les cases attaquées par le fou
   * @param {Board} board - État de l'échiquier
   * @returns {Array} Liste des cases attaquées
   */
  getAttackedSquares(board) {
    const attackedSquares = [];
    const directions = [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
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
   * Vérifie si le fou a une diagonale ouverte
   * @param {Board} board - État de l'échiquier
   * @returns {Object} Informations sur les diagonales ouvertes
   */
  getOpenDiagonals(board) {
    const openDiagonals = {
      northWest: true,
      northEast: true,
      southWest: true,
      southEast: true,
      count: 0
    };

    const directions = [
      { name: 'northWest', dir: [-1, -1] },
      { name: 'northEast', dir: [-1, 1] },
      { name: 'southWest', dir: [1, -1] },
      { name: 'southEast', dir: [1, 1] }
    ];

    for (const { name, dir } of directions) {
      const [rankDir, fileDir] = dir;
      
      // Vérifier s'il y a des obstacles dans cette direction
      for (let distance = 1; distance < 8; distance++) {
        const checkRank = this.rank + (rankDir * distance);
        const checkFile = this.file + (fileDir * distance);

        if (!board.isValidPosition(checkRank, checkFile)) {
          break;
        }

        const piece = board.getPiece(checkRank, checkFile);
        if (piece && piece.type === 'P') {
          openDiagonals[name] = false;
          break;
        }
      }

      if (openDiagonals[name]) {
        openDiagonals.count++;
      }
    }

    return openDiagonals;
  }

  /**
   * Vérifie si le fou est fianchetté
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si fianchetté
   */
  isFianchettoed(board) {
    // Positions de fianchetto pour les blancs : b2, g2
    // Positions de fianchetto pour les noirs : b7, g7
    const fianchettoSquares = this.color === 'white' ? 
      [[1, 1], [1, 6]] : [[6, 1], [6, 6]];
    
    return fianchettoSquares.some(([rank, file]) => 
      this.rank === rank && this.file === file
    );
  }

  /**
   * Évalue la position du fou
   * @param {Board} board - État de l'échiquier
   * @returns {number} Score d'évaluation
   */
  evaluate(board) {
    let score = this.value;

    // Bonus pour la mobilité
    const attackedSquares = this.getAttackedSquares(board);
    score += attackedSquares.length * 0.05;

    // Bonus pour les diagonales ouvertes
    const openDiagonals = this.getOpenDiagonals(board);
    score += openDiagonals.count * 0.1;

    // Bonus pour la position centrale
    const centerDistance = Math.max(
      Math.abs(this.rank - 3.5),
      Math.abs(this.file - 3.5)
    );
    score += (3.5 - centerDistance) * 0.05;

    // Bonus pour le fianchetto
    if (this.isFianchettoed(board)) {
      score += 0.2;
    }

    // Bonus pour la paire de fous
    if (this.hasBishopPair(board)) {
      score += 0.3;
    }

    // Malus si bloqué par ses propres pions
    if (this.isBlockedByOwnPawns(board)) {
      score -= 0.4;
    }

    return score;
  }

  /**
   * Vérifie si on a la paire de fous
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si paire de fous
   */
  hasBishopPair(board) {
    let bishopCount = 0;
    let hasLightSquareBishop = false;
    let hasDarkSquareBishop = false;

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.type === 'B' && piece.color === this.color) {
          bishopCount++;
          if (piece.squareColor === 'light') {
            hasLightSquareBishop = true;
          } else {
            hasDarkSquareBishop = true;
          }
        }
      }
    }

    return bishopCount >= 2 && hasLightSquareBishop && hasDarkSquareBishop;
  }

  /**
   * Vérifie si le fou est bloqué par ses propres pions
   * @param {Board} board - État de l'échiquier
   * @returns {boolean} True si bloqué
   */
  isBlockedByOwnPawns(board) {
    const directions = [
      [-1, -1], [-1, 1], [1, -1], [1, 1]
    ];

    let blockedDirections = 0;

    for (const [rankDir, fileDir] of directions) {
      // Vérifier les premières cases dans chaque direction
      for (let distance = 1; distance <= 2; distance++) {
        const checkRank = this.rank + (rankDir * distance);
        const checkFile = this.file + (fileDir * distance);

        if (!board.isValidPosition(checkRank, checkFile)) {
          break;
        }

        const piece = board.getPiece(checkRank, checkFile);
        if (piece && piece.type === 'P' && piece.color === this.color) {
          blockedDirections++;
          break;
        }
      }
    }

    // Considéré comme bloqué si au moins 2 directions sont bloquées
    return blockedDirections >= 2;
  }

  /**
   * Trouve les meilleures cases pour le fou
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

      // Bonus pour attaquer des pièces importantes
      const attackedSquares = this.getAttackedSquares(board);
      for (const square of attackedSquares) {
        const piece = board.getPiece(square.rank, square.file);
        if (piece && piece.color !== this.color) {
          score += piece.value * 0.1;
        }
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

module.exports = Bishop;