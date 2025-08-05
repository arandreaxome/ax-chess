import React, { useState } from 'react';
import { Game } from '../../types/chess';
import { useGame } from '../../contexts/GameContext';
import './GameControls.css';

interface GameControlsProps {
  game: Game;
  onLeave: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ game, onLeave }) => {
  const { resign, offerDraw, isMyTurn } = useGame();
  const [showConfirmResign, setShowConfirmResign] = useState(false);
  const [showConfirmDraw, setShowConfirmDraw] = useState(false);

  const handleResign = () => {
    resign();
    setShowConfirmResign(false);
  };

  const handleOfferDraw = () => {
    offerDraw();
    setShowConfirmDraw(false);
  };

  const isGameActive = game.gameState.status === 'active';

  return (
    <div className="game-controls">
      <h3>Contrôles</h3>
      
      <div className="controls-section">
        {/* Contrôles de partie */}
        {isGameActive && (
          <div className="game-actions">
            <button
              className="control-button control-button--draw"
              onClick={() => setShowConfirmDraw(true)}
              disabled={!isMyTurn}
              title="Proposer une partie nulle"
            >
              🤝 Nulle
            </button>
            
            <button
              className="control-button control-button--resign"
              onClick={() => setShowConfirmResign(true)}
              title="Abandonner la partie"
            >
              🏳️ Abandon
            </button>
          </div>
        )}

        {/* Bouton quitter */}
        <button
          className="control-button control-button--leave"
          onClick={onLeave}
        >
          🚪 Quitter
        </button>
      </div>

      {/* Pouvoirs spéciaux (TODO: Phase 2) */}
      <div className="powers-section">
        <h4>Pouvoirs spéciaux</h4>
        <div className="powers-grid">
          <div className="power-item power-item--disabled">
            <div className="power-icon">🌀</div>
            <span className="power-name">Téléportation</span>
            <span className="power-uses">0/1</span>
          </div>
          
          <div className="power-item power-item--disabled">
            <div className="power-icon">👻</div>
            <span className="power-name">Invisibilité</span>
            <span className="power-uses">0/1</span>
          </div>
          
          <div className="power-item power-item--disabled">
            <div className="power-icon">🔄</div>
            <span className="power-name">Échange</span>
            <span className="power-uses">0/1</span>
          </div>
        </div>
        <p className="powers-note">Bientôt disponible !</p>
      </div>

      {/* Historique des coups */}
      <div className="moves-history">
        <h4>Historique</h4>
        <div className="moves-list">
          {game.gameState.moves.length === 0 ? (
            <p className="no-moves">Aucun coup joué</p>
          ) : (
            <div className="moves-scroll">
              {game.gameState.moves.map((move, index) => (
                <div key={index} className="move-item">
                  <span className="move-number">
                    {Math.ceil((index + 1) / 2)}.
                    {index % 2 === 0 ? '' : '..'}
                  </span>
                  <span className="move-notation">{move.notation}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modales de confirmation */}
      {showConfirmResign && (
        <div className="modal-overlay" onClick={() => setShowConfirmResign(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirmer l'abandon</h3>
            <p>Êtes-vous sûr de vouloir abandonner cette partie ?</p>
            <div className="modal-actions">
              <button
                className="modal-button modal-button--cancel"
                onClick={() => setShowConfirmResign(false)}
              >
                Annuler
              </button>
              <button
                className="modal-button modal-button--confirm"
                onClick={handleResign}
              >
                Abandonner
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirmDraw && (
        <div className="modal-overlay" onClick={() => setShowConfirmDraw(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Proposer une nulle</h3>
            <p>Voulez-vous proposer une partie nulle à votre adversaire ?</p>
            <div className="modal-actions">
              <button
                className="modal-button modal-button--cancel"
                onClick={() => setShowConfirmDraw(false)}
              >
                Annuler
              </button>
              <button
                className="modal-button modal-button--confirm"
                onClick={handleOfferDraw}
              >
                Proposer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameControls;