import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo et nom */}
        <Link to="/" className="header-logo">
          <span className="logo-icon">♛</span>
          <span className="logo-text">AX Chess</span>
        </Link>

        {/* Navigation principale */}
        {isAuthenticated && (
          <nav className="header-nav">
            <Link to="/" className="nav-link">
              Accueil
            </Link>
            <Link to="/profile" className="nav-link">
              Profil
            </Link>
          </nav>
        )}

        {/* Section utilisateur */}
        {isAuthenticated && user ? (
          <div className="header-user">
            <div className="user-info">
              <span className="user-name">{user.username}</span>
              <span className="user-rating">{user.stats.rating.rapid}</span>
            </div>
            
            <div className="user-menu">
              <button 
                className="user-menu-toggle"
                onClick={toggleMenu}
                aria-label="Menu utilisateur"
              >
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              </button>
              
              {isMenuOpen && (
                <div className="user-menu-dropdown">
                  <Link 
                    to="/profile" 
                    className="menu-item"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mon profil
                  </Link>
                  <button 
                    className="menu-item menu-item--logout"
                    onClick={handleLogout}
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          !isAuthenticated && (
            <div className="header-auth">
              <Link to="/login" className="auth-link">
                Connexion
              </Link>
            </div>
          )
        )}

        {/* Menu mobile */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMenu}
          aria-label="Menu mobile"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* Menu mobile overlay */}
      {isMenuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            {isAuthenticated ? (
              <>
                <div className="mobile-user-info">
                  <div className="user-avatar user-avatar--large">
                    {user?.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="user-name">{user?.username}</div>
                    <div className="user-rating">Rating: {user?.stats.rating.rapid}</div>
                  </div>
                </div>
                
                <nav className="mobile-nav">
                  <Link 
                    to="/" 
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Accueil
                  </Link>
                  <Link 
                    to="/profile" 
                    className="mobile-nav-link"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profil
                  </Link>
                </nav>
                
                <button 
                  className="mobile-logout"
                  onClick={handleLogout}
                >
                  Déconnexion
                </button>
              </>
            ) : (
              <Link 
                to="/login" 
                className="mobile-nav-link"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;