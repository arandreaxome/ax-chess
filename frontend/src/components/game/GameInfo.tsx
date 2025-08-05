import React from 'react';
import { Game } from '../../types/chess';
import './GameInfo.css';

interface GameInfoProps {
  game: Game;
}

const GameInfo: React.FC<GameInfoProps> = ({ game }) => {
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusText = (): string => {
    switch (game.gameState.status) {
      case 'waiting':
        return 'En attente d\'un adversaire';
      case 'active':
        return `Tour des ${game.gameState.currentTurn === 'white' ? 'blancs' : 'noirs'}`;
      case 'finished':
        if (game.gameState.result === 'draw') {
          return 'Partie nulle';
        }
        return `Victoire des ${game.gameState.result === 'white' ? 'blancs' : 'noirs'}`;
      case 'paused':
        return 'Partie en pause';
      default:
        return 'Statut inconnu';
    }
  };

  const getStatusColor = (): string => {
    switch (game.gameState.status) {
      case 'waiting':
        return 'orange';
      case 'active':
        return game.gameState.currentTurn === 'white' ? '#f0f0f0' : '#333';
      case 'finished':
        return game.gameState.result === 'draw' ? 'gray' : 
               game.gameState.result === 'white' ? '#f0f0f0' : '#333';
      case 'paused':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <div className="game-info">
      <div className="game-header">
        <h2>Partie en cours</h2>
        <div 
          className="game-status"
          style={{ backgroundColor: getStatusColor() }}
        >
          {getStatusText()}
        </div>
      </div>

      {/* Informations des joueurs */}
      <div className="players-info">
        <div className="player-info player-info--white">
          <div className="player-header">
            <div className="player-color-indicator player-color--white"></div>
            <div className="player-details">
              <span className="player-name">{game.players.white.username}</span>
              <span className="player-rating">({game.players.white.rating})</span>
            </div>
            <div className={`connection-status ${game.players.white.isConnected ? 'connected' : 'disconnected'}`}>
              {game.players.white.isConnected ? '🟢' : '🔴'}
            </div>
          </div>
          <div className="player-time">
            ⏱️ {formatTime(game.players.white.timeRemaining)}
          </div>
        </div>

        <div className="player-info player-info--black">
          <div className="player-header">
            <div className="player-color-indicator player-color--black"></div>
            <div className="player-details">
              <span className="player-name">{game.players.black.username}</span>
              <span className="player-rating">({game.players.black.rating})</span>
            </div>
            <div className={`connection-status ${game.players.black.isConnected ? 'connected' : 'disconnected'}`}>
              {game.players.black.isConnected ? '🟢' : '🔴'}
            </div>
          </div>
          <div className="player-time">
            ⏱️ {formatTime(game.players.black.timeRemaining)}
          </div>
        </div>
      </div>

      {/* Informations de la partie */}
      <div className="game-details">
        <div className="detail-item">
          <span className="detail-label">Type:</span>
          <span className="detail-value">
            {game.timeControl >= 600 ? 'Rapide' : 
             game.timeControl >= 180 ? 'Blitz' : 'Bullet'}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Contrôle:</span>
          <span className="detail-value">
            {Math.floor(game.timeControl / 60)}min + {game.increment}s
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Classée:</span>
          <span className="detail-value">
            {game.isRanked ? 'Oui' : 'Non'}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Coups:</span>
          <span className="detail-value">
            {Math.ceil(game.gameState.moves.length / 2)}
          </span>
        </div>
      </div>

      {/* États spéciaux */}
      {game.gameState.isCheck && (
        <div className="special-status check-warning">
          ⚠️ Échec !
        </div>
      )}
      
      {game.gameState.isCheckmate && (
        <div className="special-status checkmate-warning">
          👑 Échec et mat !
        </div>
      )}
      
      {game.gameState.isStalemate && (
        <div className="special-status stalemate-warning">
          🤝 Pat - Partie nulle
        </div>
      )}
    </div>
  );
};

export default GameInfo;