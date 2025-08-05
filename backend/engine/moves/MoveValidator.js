const { positionToAlgebraic, algebraicToPosition } = require('../../../shared/constants/chess-notation');

/**
 * Classe responsable de la validation des mouvements d'échecs
 * Vérifie la légalité des coups selon toutes les règles
 */
class MoveValidator {
  constructor(board) {
    this.board = board;
  }

  /**
   * Valide si un mouvement est légal
   * @param {Object} move - Le mouvement à valider
   * @returns {Object} Résultat de la validation
   */
  isMoveLegal(move) {
    const { fromRank, fromFile, toRank, toFile, color, promotion } = move;

    try {
      // Vérifications de base
      const basicValidation = this.validateBasicMove(move);
      if (!basicValidation.isValid) {
        return basicValidation;
      }

      const piece = this.board.getPiece(fromRank, fromFile);

      // Vérifier que la pièce peut effectuer ce mouvement
      const pieceValidation = this.validatePieceMove(piece, toRank, toFile);
      if (!pieceValidation.isValid) {
        return pieceValidation;
      }

      // Vérifier que le mouvement ne met pas son propre roi en échec
      const kingSafetyValidation = this.validateKingSafety(move, color);
      if (!kingSafetyValidation.isValid) {
        return kingSafetyValidation;
      }

      // Vérifications spéciales selon le type de pièce
      const specialValidation = this.validateSpecialMoves(move, piece);
      if (!specialValidation.isValid) {
        return specialValidation;
      }

      return {
        isValid: true,
        move: this.enrichMoveData(move, piece)
      };

    } catch (error) {
      return {
        isValid: false,
        reason: 'VALIDATION_ERROR',
        message: `Erreur lors de la validation: ${error.message}`
      };
    }
  }

  /**
   * Validations de base du mouvement
   * @param {Object} move - Le mouvement
   * @returns {Object} Résultat de validation
   */
  validateBasicMove(move) {
    const { fromRank, fromFile, toRank, toFile, color } = move;

    // Vérifier que les positions sont valides
    if (!this.board.isValidPosition(fromRank, fromFile) || 
        !this.board.isValidPosition(toRank, toFile)) {
      return {
        isValid: false,
        reason: 'INVALID_POSITION',
        message: 'Position invalide'
      };
    }

    // Vérifier qu'il y a une pièce à la position de départ
    const piece = this.board.getPiece(fromRank, fromFile);
    if (!piece) {
      return {
        isValid: false,
        reason: 'NO_PIECE',
        message: 'Aucune pièce à la position de départ'
      };
    }

    // Vérifier que la pièce appartient au joueur
    if (piece.color !== color) {
      return {
        isValid: false,
        reason: 'WRONG_COLOR',
        message: 'Cette pièce ne vous appartient pas'
      };
    }

    // Vérifier que la destination n'est pas la même que le départ
    if (fromRank === toRank && fromFile === toFile) {
      return {
        isValid: false,
        reason: 'SAME_POSITION',
        message: 'Position de départ et d\'arrivée identiques'
      };
    }

    // Vérifier qu'on ne capture pas ses propres pièces
    const targetPiece = this.board.getPiece(toRank, toFile);
    if (targetPiece && targetPiece.color === color) {
      return {
        isValid: false,
        reason: 'FRIENDLY_FIRE',
        message: 'Impossible de capturer ses propres pièces'
      };
    }

    return { isValid: true };
  }

  /**
   * Valide le mouvement spécifique à la pièce
   * @param {Piece} piece - La pièce qui bouge
   * @param {number} toRank - Rang de destination
   * @param {number} toFile - Colonne de destination
   * @returns {Object} Résultat de validation
   */
  validatePieceMove(piece, toRank, toFile) {
    if (!piece.canMoveTo(toRank, toFile, this.board)) {
      return {
        isValid: false,
        reason: 'INVALID_PIECE_MOVE',
        message: `Mouvement invalide pour ${piece.type}`
      };
    }

    return { isValid: true };
  }

  /**
   * Vérifie que le mouvement ne met pas son roi en échec
   * @param {Object} move - Le mouvement
   * @param {string} color - Couleur du joueur
   * @returns {Object} Résultat de validation
   */
  validateKingSafety(move, color) {
    const { fromRank, fromFile, toRank, toFile } = move;

    // Simuler le mouvement
    const piece = this.board.getPiece(fromRank, fromFile);
    const capturedPiece = this.board.getPiece(toRank, toFile);

    // Effectuer le mouvement temporairement
    this.board.setPiece(null, fromRank, fromFile);
    this.board.setPiece(piece, toRank, toFile);

    // Vérifier si le roi est en échec
    const isKingInCheck = this.board.isKingInCheck(color);

    // Annuler le mouvement
    this.board.setPiece(piece, fromRank, fromFile);
    this.board.setPiece(capturedPiece, toRank, toFile);

    if (isKingInCheck) {
      return {
        isValid: false,
        reason: 'KING_IN_CHECK',
        message: 'Ce mouvement met votre roi en échec'
      };
    }

    return { isValid: true };
  }

  /**
   * Valide les mouvements spéciaux (roque, en passant, promotion)
   * @param {Object} move - Le mouvement
   * @param {Piece} piece - La pièce qui bouge
   * @returns {Object} Résultat de validation
   */
  validateSpecialMoves(move, piece) {
    const { fromRank, fromFile, toRank, toFile } = move;

    // Validation du roque
    if (piece.type === 'K' && Math.abs(toFile - fromFile) === 2) {
      return this.validateCastling(move, piece);
    }

    // Validation de l'en passant
    if (piece.type === 'P' && toFile !== fromFile && !this.board.getPiece(toRank, toFile)) {
      return this.validateEnPassant(move, piece);
    }

    // Validation de la promotion
    if (piece.type === 'P' && (toRank === 0 || toRank === 7)) {
      return this.validatePromotion(move, piece);
    }

    return { isValid: true };
  }

  /**
   * Valide le roque
   * @param {Object} move - Le mouvement
   * @param {Piece} king - Le roi
   * @returns {Object} Résultat de validation
   */
  validateCastling(move, king) {
    const { toFile } = move;
    const isKingside = toFile > king.file;

    // Vérifier les conditions de base du roque
    if (!king.canCastle(isKingside, this.board)) {
      return {
        isValid: false,
        reason: 'INVALID_CASTLING',
        message: 'Roque impossible dans ces conditions'
      };
    }

    return { isValid: true };
  }

  /**
   * Valide la capture en passant
   * @param {Object} move - Le mouvement
   * @param {Piece} pawn - Le pion
   * @returns {Object} Résultat de validation
   */
  validateEnPassant(move, pawn) {
    const { toRank, toFile } = move;

    if (!pawn.canCaptureEnPassant(toRank, toFile, this.board)) {
      return {
        isValid: false,
        reason: 'INVALID_EN_PASSANT',
        message: 'Capture en passant impossible'
      };
    }

    return { isValid: true };
  }

  /**
   * Valide la promotion du pion
   * @param {Object} move - Le mouvement
   * @param {Piece} pawn - Le pion
   * @returns {Object} Résultat de validation
   */
  validatePromotion(move, pawn) {
    const { toRank, promotion } = move;

    if (!pawn.canPromote(toRank)) {
      return {
        isValid: false,
        reason: 'INVALID_PROMOTION',
        message: 'Promotion impossible sur cette rangée'
      };
    }

    // Vérifier que la pièce de promotion est valide
    if (promotion && !['Q', 'R', 'B', 'N'].includes(promotion)) {
      return {
        isValid: false,
        reason: 'INVALID_PROMOTION_PIECE',
        message: 'Pièce de promotion invalide'
      };
    }

    return { isValid: true };
  }

  /**
   * Enrichit les données du mouvement avec des informations supplémentaires
   * @param {Object} move - Le mouvement de base
   * @param {Piece} piece - La pièce qui bouge
   * @returns {Object} Mouvement enrichi
   */
  enrichMoveData(move, piece) {
    const { fromRank, fromFile, toRank, toFile } = move;
    const capturedPiece = this.board.getPiece(toRank, toFile);

    const enrichedMove = {
      ...move,
      piece: piece.type,
      from: positionToAlgebraic(fromFile, fromRank),
      to: positionToAlgebraic(toFile, toRank),
      capturedPiece: capturedPiece ? capturedPiece.type : null,
      isCapture: !!capturedPiece,
      isCheck: false,
      isCheckmate: false,
      isStalemate: false,
      isCastling: false,
      isEnPassant: false,
      isPromotion: false
    };

    // Déterminer les flags spéciaux
    this.setMoveFlags(enrichedMove, piece);

    // Générer la notation algébrique
    enrichedMove.notation = this.generateAlgebraicNotation(enrichedMove);

    return enrichedMove;
  }

  /**
   * Définit les flags spéciaux du mouvement
   * @param {Object} move - Le mouvement
   * @param {Piece} piece - La pièce
   */
  setMoveFlags(move, piece) {
    const { fromFile, toFile, toRank } = move;

    // Roque
    if (piece.type === 'K' && Math.abs(toFile - fromFile) === 2) {
      move.isCastling = true;
      move.isKingside = toFile > fromFile;
    }

    // En passant
    if (piece.type === 'P' && toFile !== fromFile && !move.capturedPiece) {
      move.isEnPassant = true;
    }

    // Promotion
    if (piece.type === 'P' && (toRank === 0 || toRank === 7)) {
      move.isPromotion = true;
      move.promotionPiece = move.promotion || 'Q';
    }

    // Simuler le mouvement pour vérifier échec/mat
    const boardClone = this.board.clone();
    boardClone.makeMove(move);

    const opponentColor = piece.color === 'white' ? 'black' : 'white';
    if (boardClone.isKingInCheck(opponentColor)) {
      move.isCheck = true;

      // Vérifier si c'est mat
      if (this.isCheckmate(boardClone, opponentColor)) {
        move.isCheckmate = true;
      }
    } else {
      // Vérifier si c'est pat
      if (this.isStalemate(boardClone, opponentColor)) {
        move.isStalemate = true;
      }
    }
  }

  /**
   * Génère la notation algébrique du mouvement
   * @param {Object} move - Le mouvement
   * @returns {string} Notation algébrique
   */
  generateAlgebraicNotation(move) {
    const { piece, to, isCapture, isCastling, isPromotion, promotionPiece, isCheck, isCheckmate } = move;

    // Roque
    if (isCastling) {
      return move.isKingside ? 'O-O' : 'O-O-O';
    }

    let notation = '';

    // Ajouter la lettre de la pièce (sauf pour les pions)
    if (piece !== 'P') {
      notation += piece;
    }

    // Ajouter la position de départ si nécessaire (pour lever l'ambiguïté)
    notation += this.getDisambiguation(move);

    // Ajouter 'x' pour les captures
    if (isCapture) {
      // Pour les pions, ajouter la colonne de départ
      if (piece === 'P') {
        notation += move.from[0];
      }
      notation += 'x';
    }

    // Ajouter la position d'arrivée
    notation += to;

    // Ajouter la promotion
    if (isPromotion) {
      notation += '=' + promotionPiece;
    }

    // Ajouter les symboles d'échec/mat
    if (isCheckmate) {
      notation += '#';
    } else if (isCheck) {
      notation += '+';
    }

    return notation;
  }

  /**
   * Détermine la désambiguïsation nécessaire pour la notation
   * @param {Object} move - Le mouvement
   * @returns {string} Désambiguïsation
   */
  getDisambiguation(move) {
    const { piece, fromRank, fromFile, toRank, toFile, color } = move;

    if (piece === 'P') return '';

    // Trouver toutes les pièces du même type qui peuvent aller à la même destination
    const similarPieces = [];
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const p = this.board.getPiece(rank, file);
        if (p && p.type === piece && p.color === color && 
            (rank !== fromRank || file !== fromFile) &&
            p.canMoveTo(toRank, toFile, this.board)) {
          
          // Vérifier que ce mouvement ne met pas le roi en échec
          const testMove = { fromRank: rank, fromFile: file, toRank, toFile, color };
          if (this.validateKingSafety(testMove, color).isValid) {
            similarPieces.push({ rank, file });
          }
        }
      }
    }

    if (similarPieces.length === 0) {
      return '';
    }

    // Déterminer la désambiguïsation minimale nécessaire
    const sameFile = similarPieces.some(p => p.file === fromFile);
    const sameRank = similarPieces.some(p => p.rank === fromRank);

    if (!sameFile) {
      return String.fromCharCode(97 + fromFile); // a-h
    } else if (!sameRank) {
      return String(fromRank + 1); // 1-8
    } else {
      return positionToAlgebraic(fromFile, fromRank); // position complète
    }
  }

  /**
   * Vérifie si c'est échec et mat
   * @param {Board} board - L'échiquier
   * @param {string} color - Couleur du joueur
   * @returns {boolean} True si échec et mat
   */
  isCheckmate(board, color) {
    if (!board.isKingInCheck(color)) {
      return false;
    }

    return this.hasNoLegalMoves(board, color);
  }

  /**
   * Vérifie si c'est pat (stalemate)
   * @param {Board} board - L'échiquier
   * @param {string} color - Couleur du joueur
   * @returns {boolean} True si pat
   */
  isStalemate(board, color) {
    if (board.isKingInCheck(color)) {
      return false;
    }

    return this.hasNoLegalMoves(board, color);
  }

  /**
   * Vérifie si le joueur n'a aucun mouvement légal
   * @param {Board} board - L'échiquier
   * @param {string} color - Couleur du joueur
   * @returns {boolean} True si aucun mouvement légal
   */
  hasNoLegalMoves(board, color) {
    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = board.getPiece(rank, file);
        if (piece && piece.color === color) {
          const possibleMoves = piece.getPossibleMoves(board);
          
          for (const move of possibleMoves) {
            const testMove = {
              fromRank: rank,
              fromFile: file,
              toRank: move.toRank,
              toFile: move.toFile,
              color
            };
            
            if (this.validateKingSafety(testMove, color).isValid) {
              return false; // Au moins un mouvement légal trouvé
            }
          }
        }
      }
    }

    return true; // Aucun mouvement légal
  }

  /**
   * Retourne tous les mouvements légaux pour une couleur
   * @param {string} color - Couleur du joueur
   * @returns {Array} Liste des mouvements légaux
   */
  getAllLegalMoves(color) {
    const legalMoves = [];

    for (let rank = 0; rank < 8; rank++) {
      for (let file = 0; file < 8; file++) {
        const piece = this.board.getPiece(rank, file);
        if (piece && piece.color === color) {
          const possibleMoves = piece.getPossibleMoves(this.board);
          
          for (const move of possibleMoves) {
            const moveData = {
              fromRank: rank,
              fromFile: file,
              toRank: move.toRank,
              toFile: move.toFile,
              color,
              promotion: move.promotionPiece
            };
            
            const validation = this.isMoveLegal(moveData);
            if (validation.isValid) {
              legalMoves.push(validation.move);
            }
          }
        }
      }
    }

    return legalMoves;
  }
}

module.exports = MoveValidator;