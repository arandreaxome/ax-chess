import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginCredentials } from '../../types/auth';
import './AuthForms.css';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const { login, isLoading, error, clearError } = useAuth();
  const [formData, setFormData] = useState<LoginCredentials>({
    identifier: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Nettoyer les erreurs quand l'utilisateur tape
    if (error) {
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.identifier.trim() || !formData.password.trim()) {
      return;
    }

    const success = await login(formData);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="auth-form">
      <div className="auth-form__header">
        <h2>Connexion</h2>
        <p>Connectez-vous pour jouer aux échecs</p>
      </div>

      <form onSubmit={handleSubmit} className="auth-form__form">
        {error && (
          <div className="auth-form__error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}

        <div className="form-group">
          <label htmlFor="identifier">Nom d'utilisateur ou Email</label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            value={formData.identifier}
            onChange={handleChange}
            placeholder="Entrez votre nom d'utilisateur ou email"
            required
            autoComplete="username"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Mot de passe</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Entrez votre mot de passe"
              required
              autoComplete="current-password"
              className="form-input"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="auth-form__submit"
          disabled={isLoading || !formData.identifier.trim() || !formData.password.trim()}
        >
          {isLoading ? (
            <>
              <span className="spinner"></span>
              Connexion...
            </>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      <div className="auth-form__footer">
        <p>
          Pas encore de compte ?{' '}
          <button
            type="button"
            className="link-button"
            onClick={onSwitchToRegister}
          >
            S'inscrire
          </button>
        </p>
        
        <button
          type="button"
          className="link-button link-button--small"
          onClick={() => {/* TODO: Implémenter mot de passe oublié */}}
        >
          Mot de passe oublié ?
        </button>
      </div>
    </div>
  );
};

export default LoginForm;