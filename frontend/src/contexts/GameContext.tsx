import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Game, GameState, Move, Position, ChatMessage, SquareHighlight } from '../types/chess';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

// Types pour les actions du reducer
type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GAME'; payload: Game }
  | { type: 'UPDATE_GAME_STATE'; payload: Partial<GameState> }
  | { type: 'ADD_MOVE'; payload: Move }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_HIGHLIGHTS'; payload: SquareHighlight[] }
  | { type: 'SET_SELECTED_SQUARE'; payload: Position | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_GAME' }
  | { type: 'SET_PLAYER_CONNECTION'; payload: { playerId: string; isConnected: boolean } };

// État du contexte de jeu
interface GameContextState {
  game: Game | null;
  isLoading: boolean;
  error: string | null;
  highlights: SquareHighlight[];
  selectedSquare: Position | null;
  isMyTurn: boolean;
  myColor: 'white' | 'black' | null;
}

// État initial
const initialState: GameContextState = {
  game: null,
  isLoading: false,
  error: null,
  highlights: [],
  selectedSquare: null,
  isMyTurn: false,
  myColor: null,
};

// Reducer pour gérer l'état du jeu
const gameReducer = (state: GameContextState, action: GameAction): GameContextState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_GAME':
      return {
        ...state,
        game: action.payload,
        isLoading: false,
        error: null,
      };
    
    case 'UPDATE_GAME_STATE':
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          gameState: { ...state.game.gameState, ...action.payload },
        },
      };
    
    case 'ADD_MOVE':
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          gameState: {
            ...state.game.gameState,
            moves: [...state.game.gameState.moves, action.payload],
          },
        },
      };
    
    case 'ADD_CHAT_MESSAGE':
      if (!state.game) return state;
      return {
        ...state,
        game: {
          ...state.game,
          chat: [...state.game.chat, action.payload],
        },
      };
    
    case 'SET_HIGHLIGHTS':
      return { ...state, highlights: action.payload };
    
    case 'SET_SELECTED_SQUARE':
      return { ...state, selectedSquare: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'CLEAR_GAME':
      return initialState;
    
    case 'SET_PLAYER_CONNECTION':
      if (!state.game) return state;
      const { playerId, isConnected } = action.payload;
      const updatedGame = { ...state.game };
      
      if (updatedGame.players.white.id === playerId) {
        updatedGame.players.white.isConnected = isConnected;
      } else if (updatedGame.players.black.id === playerId) {
        updatedGame.players.black.isConnected = isConnected;
      }
      
      return { ...state, game: updatedGame };
    
    default:
      return state;
  }
};

// Interface du contexte
interface GameContextType {
  // État
  game: Game | null;
  isLoading: boolean;
  error: string | null;
  highlights: SquareHighlight[];
  selectedSquare: Position | null;
  isMyTurn: boolean;
  myColor: 'white' | 'black' | null;
  
  // Actions de jeu
  joinGame: (gameId: string) => void;
  leaveGame: () => void;
  makeMove: (from: Position, to: Position, promotion?: string) => void;
  resign: () => void;
  offerDraw: () => void;
  
  // Actions d'interface
  selectSquare: (position: Position | null) => void;
  setHighlights: (highlights: SquareHighlight[]) => void;
  clearError: () => void;
  
  // Actions de chat
  sendChatMessage: (message: string) => void;
  
  // Utilitaires
  getPossibleMoves: (position: Position) => Position[];
  isSquareHighlighted: (position: Position) => SquareHighlight | null;
}

// Création du contexte
const GameContext = createContext<GameContextType | undefined>(undefined);

// Props du provider
interface GameProviderProps {
  children: ReactNode;
}

// Provider du contexte de jeu
export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const { user } = useAuth();

  // Calculer si c'est le tour du joueur et sa couleur
  const isMyTurn = state.game && user ? 
    (state.game.gameState.currentTurn === 'white' && state.game.players.white.id === user.id) ||
    (state.game.gameState.currentTurn === 'black' && state.game.players.black.id === user.id)
    : false;

  const myColor = state.game && user ?
    (state.game.players.white.id === user.id ? 'white' : 
     state.game.players.black.id === user.id ? 'black' : null)
    : null;

  // Configuration des événements Socket.IO
  useEffect(() => {
    // Événements de jeu
    socketService.on('game:joined', (game: Game) => {
      dispatch({ type: 'SET_GAME', payload: game });
    });

    socketService.on('game:updated', (gameState: any) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: gameState });
    });

    socketService.on('game:move', (move: Move) => {
      dispatch({ type: 'ADD_MOVE', payload: move });
      // Nettoyer les highlights après un mouvement
      dispatch({ type: 'SET_HIGHLIGHTS', payload: [] });
      dispatch({ type: 'SET_SELECTED_SQUARE', payload: null });
    });

    socketService.on('game:move-error', (error: string) => {
      dispatch({ type: 'SET_ERROR', payload: error });
    });

    socketService.on('game:ended', (result: any) => {
      dispatch({ type: 'UPDATE_GAME_STATE', payload: { 
        status: 'finished',
        result: result.winner,
        resultReason: result.reason 
      }});
    });

    socketService.on('game:player-connected', (playerId: string) => {
      dispatch({ type: 'SET_PLAYER_CONNECTION', payload: { playerId, isConnected: true } });
    });

    socketService.on('game:player-disconnected', (playerId: string) => {
      dispatch({ type: 'SET_PLAYER_CONNECTION', payload: { playerId, isConnected: false } });
    });

    // Événements de chat
    socketService.on('chat:message', (message: ChatMessage) => {
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message });
    });

    // Nettoyage des événements
    return () => {
      socketService.off('game:joined');
      socketService.off('game:updated');
      socketService.off('game:move');
      socketService.off('game:move-error');
      socketService.off('game:ended');
      socketService.off('game:player-connected');
      socketService.off('game:player-disconnected');
      socketService.off('chat:message');
    };
  }, []);

  // Actions de jeu
  const joinGame = (gameId: string): void => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    socketService.joinGame(gameId);
  };

  const leaveGame = (): void => {
    socketService.leaveGame();
    dispatch({ type: 'CLEAR_GAME' });
  };

  const makeMove = (from: Position, to: Position, promotion?: string): void => {
    if (!state.game || !isMyTurn) return;

    socketService.makeMove(state.game.id, {
      fromRank: from.rank,
      fromFile: from.file,
      toRank: to.rank,
      toFile: to.file,
      promotion,
    });
  };

  const resign = (): void => {
    if (!state.game) return;
    socketService.resign(state.game.id);
  };

  const offerDraw = (): void => {
    if (!state.game) return;
    socketService.offerDraw(state.game.id);
  };

  // Actions d'interface
  const selectSquare = (position: Position | null): void => {
    dispatch({ type: 'SET_SELECTED_SQUARE', payload: position });
    
    if (position) {
      // Calculer les mouvements possibles et les highlights
      const possibleMoves = getPossibleMoves(position);
      const highlights: SquareHighlight[] = [
        { position, type: 'selected' },
        ...possibleMoves.map(pos => ({ position: pos, type: 'possible' as const })),
      ];
      dispatch({ type: 'SET_HIGHLIGHTS', payload: highlights });
    } else {
      dispatch({ type: 'SET_HIGHLIGHTS', payload: [] });
    }
  };

  const setHighlights = (highlights: SquareHighlight[]): void => {
    dispatch({ type: 'SET_HIGHLIGHTS', payload: highlights });
  };

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null });
  };

  // Actions de chat
  const sendChatMessage = (message: string): void => {
    if (!state.game) return;
    socketService.sendChatMessage(state.game.id, message);
  };

  // Utilitaires
  const getPossibleMoves = (position: Position): Position[] => {
    // TODO: Implémenter la logique de calcul des mouvements possibles
    // Pour l'instant, retourner un tableau vide
    return [];
  };

  const isSquareHighlighted = (position: Position): SquareHighlight | null => {
    return state.highlights.find(h => 
      h.position.rank === position.rank && h.position.file === position.file
    ) || null;
  };

  const contextValue: GameContextType = {
    // État
    game: state.game,
    isLoading: state.isLoading,
    error: state.error,
    highlights: state.highlights,
    selectedSquare: state.selectedSquare,
    isMyTurn,
    myColor,
    
    // Actions de jeu
    joinGame,
    leaveGame,
    makeMove,
    resign,
    offerDraw,
    
    // Actions d'interface
    selectSquare,
    setHighlights,
    clearError,
    
    // Actions de chat
    sendChatMessage,
    
    // Utilitaires
    getPossibleMoves,
    isSquareHighlighted,
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
};

// Hook pour utiliser le contexte de jeu
export const useGame = (): GameContextType => {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error('useGame doit être utilisé dans un GameProvider');
  }
  
  return context;
};

export default GameContext;