import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import RegisterForm from '../components/auth/RegisterForm';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuthSuccess = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="logo">
            <span className="logo-icon">♛</span>
            <span className="logo-text">AX Chess</span>
          </div>
          <p className="tagline">
            Le jeu d'échecs réinventé avec des pouvoirs spéciaux
          </p>
        </div>

        <div className="auth-section">
          {isLogin ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setIsLogin(false)}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setIsLogin(true)}
            />
          )}
        </div>

        <div className="features-preview">
          <h3>Découvrez AX Chess</h3>
          <div className="preview-features">
            <div className="preview-feature">
              <div className="preview-icon">🌀</div>
              <span>Téléportation</span>
            </div>
            <div className="preview-feature">
              <div className="preview-icon">👻</div>
              <span>Invisibilité</span>
            </div>
            <div className="preview-feature">
              <div className="preview-icon">🔄</div>
              <span>Échange</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;