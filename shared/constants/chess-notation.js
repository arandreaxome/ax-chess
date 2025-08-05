/**
 * Constantes pour la notation d'échecs et les utilitaires
 * Utilise la notation algébrique anglaise standard
 */

// Colonnes de l'échiquier (files)
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

// Rangées de l'échiquier (ranks)  
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];

// Types de pièces en notation anglaise
const PIECE_TYPES = {
  KING: 'K',
  QUEEN: 'Q', 
  ROOK: 'R',
  BISHOP: 'B',
  KNIGHT: 'N',
  PAWN: 'P'
};

// Couleurs des joueurs
const COLORS = {
  WHITE: 'white',
  BLACK: 'black'
};

// Résultats de partie (format PGN)
const GAME_RESULTS = {
  WHITE_WINS: '1-0',
  BLACK_WINS: '0-1', 
  DRAW: '1/2-1/2',
  ONGOING: '*'
};

// Raisons de fin de partie
const GAME_END_REASONS = {
  CHECKMATE: 'checkmate',
  RESIGNATION: 'resignation',
  TIMEOUT: 'timeout',
  DRAW_AGREEMENT: 'draw_agreement',
  STALEMATE: 'stalemate',
  INSUFFICIENT_MATERIAL: 'insufficient_material',
  THREEFOLD_REPETITION: 'threefold_repetition',
  FIFTY_MOVE_RULE: 'fifty_move_rule',
  ABANDONMENT: 'abandonment'
};

// Types de parties
const GAME_TYPES = {
  BULLET: 'bullet',    // < 3 minutes
  BLITZ: 'blitz',      // 3-10 minutes  
  RAPID: 'rapid',      // 10-60 minutes
  CLASSIC: 'classic',  // > 60 minutes
  CUSTOM: 'custom'
};

// Pouvoirs spéciaux
const SPECIAL_POWERS = {
  TELEPORTATION: 'teleportation',
  INVISIBILITY: 'invisibility', 
  EXCHANGE: 'exchange'
};

/**
 * Convertit une position numérique en notation algébrique
 * @param {number} file - Colonne (0-7)
 * @param {number} rank - Rangée (0-7) 
 * @returns {string} Position algébrique (ex: 'e4')
 */
const positionToAlgebraic = (file, rank) => {
  if (file < 0 || file > 7 || rank < 0 || rank > 7) {
    throw new Error('Position invalide');
  }
  return FILES[file] + RANKS[rank];
};

/**
 * Convertit une notation algébrique en position numérique
 * @param {string} algebraic - Position algébrique (ex: 'e4')
 * @returns {Object} Position {file, rank}
 */
const algebraicToPosition = (algebraic) => {
  if (typeof algebraic !== 'string' || algebraic.length !== 2) {
    throw new Error('Notation algébrique invalide');
  }
  
  const file = FILES.indexOf(algebraic[0]);
  const rank = RANKS.indexOf(algebraic[1]);
  
  if (file === -1 || rank === -1) {
    throw new Error('Notation algébrique invalide');
  }
  
  return { file, rank };
};

/**
 * Valide si une notation algébrique est correcte
 * @param {string} algebraic - Position à valider
 * @returns {boolean} True si valide
 */
const isValidAlgebraic = (algebraic) => {
  try {
    algebraicToPosition(algebraic);
    return true;
  } catch {
    return false;
  }
};

/**
 * Calcule la distance entre deux cases
 * @param {string} from - Case de départ
 * @param {string} to - Case d'arrivée  
 * @returns {Object} Distance {files, ranks, total}
 */
const getDistance = (from, to) => {
  const fromPos = algebraicToPosition(from);
  const toPos = algebraicToPosition(to);
  
  const files = Math.abs(toPos.file - fromPos.file);
  const ranks = Math.abs(toPos.rank - fromPos.rank);
  
  return {
    files,
    ranks, 
    total: Math.max(files, ranks)
  };
};

/**
 * Vérifie si un mouvement est diagonal
 * @param {string} from - Case de départ
 * @param {string} to - Case d'arrivée
 * @returns {boolean} True si diagonal
 */
const isDiagonalMove = (from, to) => {
  const distance = getDistance(from, to);
  return distance.files === distance.ranks && distance.files > 0;
};

/**
 * Vérifie si un mouvement est horizontal/vertical
 * @param {string} from - Case de départ  
 * @param {string} to - Case d'arrivée
 * @returns {boolean} True si horizontal/vertical
 */
const isStraightMove = (from, to) => {
  const distance = getDistance(from, to);
  return (distance.files === 0 && distance.ranks > 0) || 
         (distance.ranks === 0 && distance.files > 0);
};

/**
 * Génère toutes les cases de l'échiquier
 * @returns {Array} Liste de toutes les cases
 */
const getAllSquares = () => {
  const squares = [];
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      squares.push(positionToAlgebraic(file, rank));
    }
  }
  return squares;
};

/**
 * Détermine la couleur d'une case
 * @param {string} square - Case en notation algébrique
 * @returns {string} 'light' ou 'dark'
 */
const getSquareColor = (square) => {
  const pos = algebraicToPosition(square);
  return (pos.file + pos.rank) % 2 === 0 ? 'dark' : 'light';
};

module.exports = {
  FILES,
  RANKS,
  PIECE_TYPES,
  COLORS,
  GAME_RESULTS,
  GAME_END_REASONS,
  GAME_TYPES,
  SPECIAL_POWERS,
  positionToAlgebraic,
  algebraicToPosition,
  isValidAlgebraic,
  getDistance,
  isDiagonalMove,
  isStraightMove,
  getAllSquares,
  getSquareColor
}; 