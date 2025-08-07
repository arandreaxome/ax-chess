// Types pour l'authentification et les utilisateurs
export interface User {
  id: string;
  username: string;
  email: string;
  profile: UserProfile;
  stats: UserStats;
  preferences: UserPreferences;
  createdAt: Date;
  lastActive: Date;
}

export interface UserProfile {
  avatar?: string;
  bio?: string;
  country?: string;
  title?: string;
  level: number;
  experience: number;
  coins: number;
}

export interface UserStats {
  rating: {
    bullet: number;
    blitz: number;
    rapid: number;
    classic: number;
  };
  games: {
    total: number;
    won: number;
    lost: number;
    drawn: number;
  };
  winRate: number;
  averageRating: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  boardTheme: string;
  pieceSet: string;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
  autoQueen: boolean;
  showLegalMoves: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
}

// Types pour l'authentification
export interface LoginCredentials {
  identifier: string; // username ou email
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Types pour les réponses API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: User;
  tokens: AuthTokens;
  message: string;
}

export interface ProfileResponse {
  user: User;
}

export interface CreateGameResponse {
  gameId: string;
  message?: string;
}