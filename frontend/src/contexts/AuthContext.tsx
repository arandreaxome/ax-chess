import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import authService from '../services/authService';
import socketService from '../services/socketService';

// Types pour les actions du reducer
type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' };

// État initial
const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Reducer pour gérer l'état d'authentification
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        tokens: authService.getStoredTokens(),
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };
    
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Interface du contexte
interface AuthContextType {
  // État
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<boolean>;
  clearError: () => void;
  refreshUser: () => Promise<void>;
}

// Création du contexte
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Props du provider
interface AuthProviderProps {
  children: ReactNode;
}

// Provider du contexte d'authentification
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      try {
        if (authService.isAuthenticated()) {
          const response = await authService.getProfile();
          
          if (response.success && response.data && response.data.user) {
            dispatch({ type: 'SET_USER', payload: response.data.user });
            
            // Connecter le socket avec les tokens
            const tokens = authService.getStoredTokens();
            if (tokens) {
              socketService.connect(tokens);
            }
          } else {
            // Token invalide, nettoyer l'auth
            authService.clearAuth();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'auth:', error);
        authService.clearAuth();
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  // Connexion
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
        
        // Connecter le socket
        socketService.connect(response.data.tokens);
        
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Erreur de connexion' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de connexion au serveur' });
      return false;
    }
  };

  // Inscription
  const register = async (data: RegisterData): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await authService.register(data);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
        
        // Connecter le socket
        socketService.connect(response.data.tokens);
        
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Erreur d\'inscription' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de connexion au serveur' });
      return false;
    }
  };

  // Déconnexion
  const logout = async (): Promise<void> => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Déconnecter le socket
      socketService.disconnect();
      
      // Nettoyer l'état local
      dispatch({ type: 'LOGOUT' });
    }
  };

  // Mise à jour du profil
  const updateProfile = async (updates: Partial<User>): Promise<boolean> => {
    dispatch({ type: 'CLEAR_ERROR' });

    try {
      const response = await authService.updateProfile(updates);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_USER', payload: response.data });
        return true;
      } else {
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Erreur de mise à jour' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erreur de connexion au serveur' });
      return false;
    }
  };

  // Rafraîchir les données utilisateur
  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authService.getProfile();
      
      if (response.success && response.data && response.data.user) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du profil:', error);
    }
  };

  // Nettoyer les erreurs
  const clearError = (): void => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextType = {
    // État
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    register,
    logout,
    updateProfile,
    clearError,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  
  return context;
};

export default AuthContext;