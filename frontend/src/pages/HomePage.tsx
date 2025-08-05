import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { ApiResponse, CreateGameResponse } from '../types/auth';
import './HomePage.css';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningMatchmaking, setIsJoiningMatchmaking] = useState(false);

  const handleCreateGame = async () => {
    setIsCreatingGame(true);
    try {
      const response: ApiResponse<CreateGameResponse> = await apiService.post('/game/create', {
        timeControl: 900, // 15 minutes
        increment: 10,
        isRanked: true,
        gameType: 'rapid'
      });

      if (response.success && response.data) {
        navigate(`/game/${response.data.gameId}`);
      }
    } catch (error) {
      console.error('Erreur lors de la création de la partie:', error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinMatchmaking = async () => {
    setIsJoiningMatchmaking(true);
    try {
      const response = await apiService.post('/game/matchmaking', {
        timeControl: 900,
        gameType: 'rapid'
      });

      if (response.success) {
        // Le matchmaking va nous notifier via WebSocket quand une partie est trouvée
        // Pour l'instant, on simule la redirection
        // TODO: Implémenter l'écoute des événements de matchmaking
      }
    } catch (error) {
      console.error('Erreur lors du matchmaking:', error);
    } finally {
      setIsJoiningMatchmaking(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Section de bienvenue */}
        <section className="welcome-section">
          <div className="welcome-content">
            <h1>Bienvenue sur AX Chess</h1>
            <p className="welcome-subtitle">
              Jouez aux échecs avec des pouvoirs spéciaux uniques !
            </p>
            {user && (
              <div className="user-welcome">
                <h2>Salut, {user.username} ! 👋</h2>
                <div className="user-stats">
                  <div className="stat-item">
                    <span className="stat-label">Niveau</span>
                    <span className="stat-value">{user.profile.level}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Rating</span>
                    <span className="stat-value">{user.stats.rating.rapid}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Parties</span>
                    <span className="stat-value">{user.stats.games.total}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Section des actions de jeu */}
        <section className="game-actions">
          <h2>Commencer à jouer</h2>
          <div className="action-cards">
            <div className="action-card">
              <div className="card-icon">⚡</div>
              <h3>Partie rapide</h3>
              <p>Trouvez un adversaire automatiquement</p>
              <button 
                className="action-button action-button--primary"
                onClick={handleJoinMatchmaking}
                disabled={isJoiningMatchmaking}
              >
                {isJoiningMatchmaking ? 'Recherche...' : 'Jouer maintenant'}
              </button>
            </div>

            <div className="action-card">
              <div className="card-icon">🎮</div>
              <h3>Créer une partie</h3>
              <p>Configurez votre propre partie</p>
              <button 
                className="action-button action-button--secondary"
                onClick={handleCreateGame}
                disabled={isCreatingGame}
              >
                {isCreatingGame ? 'Création...' : 'Créer une partie'}
              </button>
            </div>

            <div className="action-card">
              <div className="card-icon">👥</div>
              <h3>Rejoindre une partie</h3>
              <p>Entrez un code de partie</p>
              <button 
                className="action-button action-button--tertiary"
                onClick={() => {/* TODO: Implémenter */}}
              >
                Rejoindre
              </button>
            </div>
          </div>
        </section>

        {/* Section des fonctionnalités */}
        <section className="features-section">
          <h2>Fonctionnalités uniques</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">🌀</div>
              <h3>Téléportation</h3>
              <p>Déplacez instantanément vos pièces vers n'importe quelle case libre</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">👻</div>
              <h3>Invisibilité</h3>
              <p>Rendez une pièce invisible à votre adversaire pendant 3 tours</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">🔄</div>
              <h3>Échange</h3>
              <p>Permutez la position de deux de vos pièces</p>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">⏱️</div>
              <h3>Temps réel</h3>
              <p>Parties fluides avec synchronisation instantanée</p>
            </div>
          </div>
        </section>

        {/* Section des parties récentes */}
        <section className="recent-games">
          <h2>Parties récentes</h2>
          <div className="games-list">
            <p className="no-games">Aucune partie récente. Commencez à jouer !</p>
            {/* TODO: Implémenter la liste des parties récentes */}
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;