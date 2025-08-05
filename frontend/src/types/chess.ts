// Types pour le jeu d'échecs
export type PieceColor = 'white' | 'black';
export type PieceType = 'K' | 'Q' | 'R' | 'B' | 'N' | 'P';

export interface Position {
  rank: number; // 0-7
  file: number; // 0-7
}

export interface Piece {
  type: PieceType;
  color: PieceColor;
  position: Position;
  hasMoved?: boolean;
}

export interface Move {
  from: Position;
  to: Position;
  piece: Piece;
  capturedPiece?: Piece;
  promotion?: PieceType;
  isEnPassant?: boolean;
  isCastling?: boolean;
  notation: string;
}

export interface GameState {
  board: (Piece | null)[][];
  currentTurn: PieceColor;
  status: 'waiting' | 'active' | 'finished' | 'paused';
  result?: 'white' | 'black' | 'draw';
  resultReason?: string;
  moves: Move[];
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  canCastle: {
    white: { kingside: boolean; queenside: boolean };
    black: { kingside: boolean; queenside: boolean };
  };
  enPassantTarget?: Position;
}

export interface Player {
  id: string;
  username: string;
  rating: number;
  color: PieceColor;
  timeRemaining: number;
  isConnected: boolean;
}

export interface Game {
  id: string;
  players: {
    white: Player;
    black: Player;
  };
  gameState: GameState;
  timeControl: number;
  increment: number;
  isRanked: boolean;
  startTime: Date;
  endTime?: Date;
  chat: ChatMessage[];
}

export interface ChatMessage {
  id: string;
  playerId: string;
  username: string;
  message: string;
  timestamp: Date;
  type: 'message' | 'system';
}

// Types pour les pouvoirs spéciaux
export type PowerType = 'teleport' | 'invisibility' | 'swap';

export interface Power {
  type: PowerType;
  name: string;
  description: string;
  usesRemaining: number;
  maxUses: number;
  cooldown: number;
  lastUsed?: Date;
}

export interface PowerUse {
  type: PowerType;
  playerId: string;
  targetSquares: Position[];
  timestamp: Date;
}

// Types pour l'interface utilisateur
export interface SquareHighlight {
  position: Position;
  type: 'possible' | 'selected' | 'check' | 'lastMove' | 'capture';
}

export interface DragState {
  isDragging: boolean;
  piece?: Piece;
  startPosition?: Position;
  currentPosition?: { x: number; y: number };
}