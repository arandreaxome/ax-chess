/**
 * Constantes pour la notation universelle des échecs (notation algébrique anglaise)
 * Basé sur le standard international - https://ecole.apprendre-les-echecs.com/notation-partie-echecs/
 */

// Notation des pièces (notation anglaise universelle)
export const PIECE_NOTATION = {
  KING: 'K',    // King / Roi
  QUEEN: 'Q',   // Queen / Dame
  ROOK: 'R',    // Rook / Tour
  BISHOP: 'B',  // Bishop / Fou
  KNIGHT: 'N',  // Knight / Cavalier
  PAWN: ''      // Pion (pas de lettre, juste la case de destination)
}

// Inverse mapping pour conversion
export const NOTATION_TO_PIECE = {
  'K': 'KING',
  'Q': 'QUEEN',
  'R': 'ROOK',
  'B': 'BISHOP',
  'N': 'KNIGHT'
}

// Colonnes de l'échiquier (a-h)
export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

// Rangées de l'échiquier (1-8)
export const RANKS = [1, 2, 3, 4, 5, 6, 7, 8]

// Symboles spéciaux de notation
export const NOTATION_SYMBOLS = {
  CAPTURE: 'x',         // Capture
  CHECK: '+',           // Échec
  CHECKMATE: '#',       // Mat
  CASTLING_KINGSIDE: 'O-O',      // Petit roque
  CASTLING_QUEENSIDE: 'O-O-O',   // Grand roque
  PROMOTION: '=',       // Promotion (ex: e8=Q)
  EN_PASSANT: ' e.p.',  // En passant (optionnel)
  DRAW_OFFER: '(=)'     // Proposition de nulle
}

// Résultats de partie (format PGN)
export const GAME_RESULTS = {
  WHITE_WINS: '1-0',
  BLACK_WINS: '0-1',
  DRAW: '1/2-1/2',
  ONGOING: '*'
}

// Évaluation des coups (symboles d'annotation)
export const MOVE_ANNOTATIONS = {
  BRILLIANT: '!!',      // Coup brillant
  GOOD: '!',           // Bon coup
  INTERESTING: '!?',   // Coup intéressant
  DUBIOUS: '?!',       // Coup douteux
  MISTAKE: '?',        // Erreur
  BLUNDER: '??'        // Gaffe
}

// Évaluation de position
export const POSITION_ANNOTATIONS = {
  WHITE_ADVANTAGE: '±',        // Avantage blanc
  BLACK_ADVANTAGE: '∓',        // Avantage noir
  WHITE_WINNING: '+-',         // Blanc gagnant
  BLACK_WINNING: '-+',         // Noir gagnant
  EQUAL: '=',                  // Position égale
  UNCLEAR: '∞'                 // Position peu claire
}

/**
 * Convertit une position numérique en notation algébrique
 * @param {number} file - Colonne (0-7)
 * @param {number} rank - Rangée (0-7)
 * @returns {string} Position en notation algébrique (ex: 'e4')
 */
export function positionToAlgebraic(file, rank) {
  return FILES[file] + (rank + 1)
}

/**
 * Convertit une notation algébrique en position numérique
 * @param {string} algebraic - Position algébrique (ex: 'e4')
 * @returns {{file: number, rank: number}} Position numérique
 */
export function algebraicToPosition(algebraic) {
  return {
    file: FILES.indexOf(algebraic[0]),
    rank: parseInt(algebraic[1]) - 1
  }
}

/**
 * Valide une notation algébrique
 * @param {string} algebraic - Position à valider
 * @returns {boolean} True si valide
 */
export function isValidAlgebraicNotation(algebraic) {
  if (!algebraic || algebraic.length !== 2) return false
  return FILES.includes(algebraic[0]) && RANKS.includes(parseInt(algebraic[1]))
}

// Export par défaut pour compatibilité
export default {
  PIECE_NOTATION,
  NOTATION_TO_PIECE,
  FILES,
  RANKS,
  NOTATION_SYMBOLS,
  GAME_RESULTS,
  MOVE_ANNOTATIONS,
  POSITION_ANNOTATIONS,
  positionToAlgebraic,
  algebraicToPosition,
  isValidAlgebraicNotation
} 