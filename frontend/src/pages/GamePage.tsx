import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGame } from '../contexts/GameContext';
import { useAuth } from '../contexts/AuthContext';
import ChessBoard from '../components/chess/ChessBoard';
import GameInfo from '../components/game/GameInfo';
import GameChat from '../components/game/GameChat';
import GameControls from '../components/game/GameControls';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import './GamePage.css';

const GamePage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    game, 
    isLoading, 
    error, 
    joinGame, 
    leaveGame, 
    myColor 
  } = useGame();

  useEffect(() => {
    if (gameId) {
      joinGame(gameId);
    }

    // Nettoyage lors du démontage du composant
    return () => {
      leaveGame();
    };
  }, [gameId, joinGame, leaveGame]);

  const handleLeaveGame = () => {
    leaveGame();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="game-page">
        <div className="game-loading">
          <LoadingSpinner />
          <p>Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-page">
        <div className="game-error">
          <h2>Erreur</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/')} className="button button--primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="game-page">
        <div className="game-not-found">
          <h2>Partie non trouvée</h2>
          <p>Cette partie n'existe pas ou n'est plus disponible.</p>
          <button onClick={() => navigate('/')} className="button button--primary">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-page">
      <div className="game-layout">
        {/* Panneau de gauche - Informations et contrôles */}
        <aside className="game-sidebar game-sidebar--left">
          <GameInfo game={game} />
          <GameControls 
            game={game} 
            onLeave={handleLeaveGame}
          />
        </aside>

        {/* Zone centrale - Échiquier */}
        <main className="game-main">
          <div className="game-board-container">
            <ChessBoard
              orientation={myColor || 'white'}
              size={480}
              interactive={true}
            />
          </div>
        </main>

        {/* Panneau de droite - Chat et historique */}
        <aside className="game-sidebar game-sidebar--right">
          <GameChat 
            game={game}
            currentUserId={user?.id || ''}
          />
        </aside>
      </div>
    </div>
  );
};

export default GamePage;