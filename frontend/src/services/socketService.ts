import { io, Socket } from 'socket.io-client';
import { Game, Move, ChatMessage, Position } from '../types/chess';
import { AuthTokens } from '../types/auth';

export interface SocketEvents {
  // Événements de connexion
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'connect_error': (error: Error) => void;
  
  // Événements de jeu
  'game:joined': (game: Game) => void;
  'game:left': () => void;
  'game:updated': (gameState: any) => void;
  'game:move': (move: Move) => void;
  'game:move-error': (error: string) => void;
  'game:ended': (result: any) => void;
  'game:player-connected': (playerId: string) => void;
  'game:player-disconnected': (playerId: string) => void;
  
  // Événements de chat
  'chat:message': (message: ChatMessage) => void;
  
  // Événements de matchmaking
  'matchmaking:joined': () => void;
  'matchmaking:left': () => void;
  'matchmaking:found': (gameId: string) => void;
  'matchmaking:update': (queueSize: number, estimatedWait: number) => void;
  
  // Événements des pouvoirs spéciaux
  'power:used': (powerUse: any) => void;
  'power:available': (powers: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private currentGameId: string | null = null;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const serverURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    this.socket = io(serverURL, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
      timeout: 10000,
      forceNew: true,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('🔌 Connecté au serveur Socket.IO');
      this.isConnected = true;
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 Déconnecté du serveur Socket.IO:', reason);
      this.isConnected = false;
      
      if (reason === 'io server disconnect') {
        // Le serveur a fermé la connexion, on essaie de se reconnecter
        this.reconnect();
      }
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('❌ Erreur de connexion Socket.IO:', error);
      this.isConnected = false;
      this.reconnect();
    });
  }

  private reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Nombre maximum de tentatives de reconnexion atteint');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Backoff exponentiel
    
    console.log(`🔄 Tentative de reconnexion ${this.reconnectAttempts}/${this.maxReconnectAttempts} dans ${delay}ms`);
    
    setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  // Méthodes de connexion
  connect(tokens?: AuthTokens): void {
    if (!this.socket) {
      this.initializeSocket();
    }

    if (tokens) {
      this.socket!.auth = {
        token: tokens.accessToken,
      };
    }

    this.socket!.connect();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
      this.currentGameId = null;
    }
  }

  // Méthodes d'écoute d'événements
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.on(event as string, callback);
    }
  }

  off<K extends keyof SocketEvents>(event: K, callback?: SocketEvents[K]): void {
    if (this.socket) {
      this.socket.off(event as string, callback);
    }
  }

  // Méthodes de jeu
  joinGame(gameId: string): void {
    if (this.socket && this.isConnected) {
      this.currentGameId = gameId;
      this.socket.emit('game:join', { gameId });
    }
  }

  leaveGame(): void {
    if (this.socket && this.isConnected && this.currentGameId) {
      this.socket.emit('game:leave', { gameId: this.currentGameId });
      this.currentGameId = null;
    }
  }

  makeMove(gameId: string, move: { fromRank: number; fromFile: number; toRank: number; toFile: number; promotion?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('game:move', { gameId, ...move });
    }
  }

  resign(gameId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('game:resign', { gameId });
    }
  }

  offerDraw(gameId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('game:offer-draw', { gameId });
    }
  }

  acceptDraw(gameId: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('game:accept-draw', { gameId });
    }
  }

  // Méthodes de chat
  sendChatMessage(gameId: string, message: string): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('chat:message', { gameId, message });
    }
  }

  // Méthodes de matchmaking
  joinMatchmaking(preferences: { timeControl?: number; gameType?: string }): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('matchmaking:join', preferences);
    }
  }

  leaveMatchmaking(): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('matchmaking:leave');
    }
  }

  // Méthodes des pouvoirs spéciaux
  usePower(gameId: string, powerType: string, targetSquares: Position[]): void {
    if (this.socket && this.isConnected) {
      this.socket.emit('power:use', { gameId, powerType, targetSquares });
    }
  }

  // Méthodes utilitaires
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getCurrentGameId(): string | null {
    return this.currentGameId;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  // Nettoyage
  destroy(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentGameId = null;
    this.reconnectAttempts = 0;
  }
}

export const socketService = new SocketService();
export default socketService;