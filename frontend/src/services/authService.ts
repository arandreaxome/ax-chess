import apiService from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  User, 
  AuthTokens, 
  LoginResponse, 
  RegisterResponse,
  ApiResponse 
} from '../types/auth';

class AuthService {
  // Inscription
  async register(data: RegisterData): Promise<ApiResponse<RegisterResponse>> {
    const response = await apiService.post<RegisterResponse>('/auth/register', data);
    
    if (response.success && response.data) {
      // Stocker les tokens automatiquement
      apiService.setAuthTokens(response.data.tokens);
    }
    
    return response;
  }

  // Connexion
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiService.post<LoginResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Stocker les tokens automatiquement
      apiService.setAuthTokens(response.data.tokens);
    }
    
    return response;
  }

  // Déconnexion
  async logout(): Promise<ApiResponse> {
    const response = await apiService.post('/auth/logout');
    
    // Nettoyer les tokens localement même si la requête échoue
    apiService.clearAuth();
    
    return response;
  }

  // Déconnexion de tous les appareils
  async logoutAll(): Promise<ApiResponse> {
    const response = await apiService.post('/auth/logout-all');
    
    // Nettoyer les tokens localement même si la requête échoue
    apiService.clearAuth();
    
    return response;
  }

  // Récupérer le profil utilisateur
  async getProfile(): Promise<ApiResponse<User>> {
    return await apiService.get<User>('/auth/me');
  }

  // Mettre à jour le profil
  async updateProfile(updates: Partial<User>): Promise<ApiResponse<User>> {
    return await apiService.put<User>('/auth/profile', updates);
  }

  // Changer le mot de passe
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return await apiService.put('/auth/password', {
      currentPassword,
      newPassword,
    });
  }

  // Mot de passe oublié
  async forgotPassword(email: string): Promise<ApiResponse> {
    return await apiService.post('/auth/forgot-password', { email });
  }

  // Réinitialiser le mot de passe
  async resetPassword(token: string, password: string): Promise<ApiResponse> {
    return await apiService.post('/auth/reset-password', { token, password });
  }

  // Vérifier l'email
  async verifyEmail(token: string): Promise<ApiResponse> {
    return await apiService.post('/auth/verify-email', { token });
  }

  // Renvoyer l'email de vérification
  async resendVerification(): Promise<ApiResponse> {
    return await apiService.post('/auth/resend-verification');
  }

  // Vérifier si l'utilisateur est connecté
  isAuthenticated(): boolean {
    const tokens = this.getStoredTokens();
    return tokens !== null && this.isTokenValid(tokens.accessToken);
  }

  // Récupérer les tokens stockés
  getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem('ax-chess-tokens');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des tokens:', error);
      return null;
    }
  }

  // Vérifier si un token est valide (pas expiré)
  private isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  // Décoder le token pour récupérer les informations utilisateur
  decodeToken(token: string): any {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
      console.error('Erreur lors du décodage du token:', error);
      return null;
    }
  }

  // Nettoyer l'authentification
  clearAuth(): void {
    apiService.clearAuth();
  }
}

export const authService = new AuthService();
export default authService;