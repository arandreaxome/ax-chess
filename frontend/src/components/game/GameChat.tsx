import React, { useState, useRef, useEffect } from 'react';
import { Game, ChatMessage } from '../../types/chess';
import { useGame } from '../../contexts/GameContext';
import './GameChat.css';

interface GameChatProps {
  game: Game;
  currentUserId: string;
}

const GameChat: React.FC<GameChatProps> = ({ game, currentUserId }) => {
  const { sendChatMessage } = useGame();
  const [message, setMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [game.chat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    sendChatMessage(message.trim());
    setMessage('');
    
    // Refocus sur l'input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const formatMessageTime = (timestamp: Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getMessageClass = (msg: ChatMessage): string => {
    const classes = ['chat-message'];
    
    if (msg.type === 'system') {
      classes.push('chat-message--system');
    } else if (msg.playerId === currentUserId) {
      classes.push('chat-message--own');
    } else {
      classes.push('chat-message--other');
    }
    
    return classes.join(' ');
  };

  return (
    <div className={`game-chat ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="chat-header">
        <h3>Chat</h3>
        <button
          className="chat-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-label={isExpanded ? 'Réduire le chat' : 'Développer le chat'}
        >
          {isExpanded ? '📉' : '📈'}
        </button>
      </div>

      {isExpanded && (
        <>
          <div className="chat-messages">
            {game.chat.length === 0 ? (
              <div className="no-messages">
                <p>Aucun message pour le moment</p>
                <p className="chat-hint">Dites bonjour à votre adversaire ! 👋</p>
              </div>
            ) : (
              <div className="messages-list">
                {game.chat.map((msg) => (
                  <div key={msg.id} className={getMessageClass(msg)}>
                    {msg.type === 'system' ? (
                      <div className="system-message">
                        <span className="system-icon">ℹ️</span>
                        <span className="message-text">{msg.message}</span>
                        <span className="message-time">
                          {formatMessageTime(msg.timestamp)}
                        </span>
                      </div>
                    ) : (
                      <div className="user-message">
                        <div className="message-header">
                          <span className="message-author">
                            {msg.playerId === currentUserId ? 'Vous' : msg.username}
                          </span>
                          <span className="message-time">
                            {formatMessageTime(msg.timestamp)}
                          </span>
                        </div>
                        <div className="message-content">
                          {msg.message}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <form className="chat-input-form" onSubmit={handleSendMessage}>
            <div className="input-container">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tapez votre message..."
                maxLength={200}
                className="chat-input"
              />
              <button
                type="submit"
                disabled={!message.trim()}
                className="send-button"
                aria-label="Envoyer le message"
              >
                📤
              </button>
            </div>
            <div className="input-info">
              <span className="char-count">
                {message.length}/200
              </span>
            </div>
          </form>

          {/* Messages prédéfinis rapides */}
          <div className="quick-messages">
            <button
              className="quick-message"
              onClick={() => sendChatMessage('Bonne partie ! 🎯')}
            >
              Bonne partie !
            </button>
            <button
              className="quick-message"
              onClick={() => sendChatMessage('Bien joué ! 👏')}
            >
              Bien joué !
            </button>
            <button
              className="quick-message"
              onClick={() => sendChatMessage('Merci pour la partie ! 🤝')}
            >
              Merci !
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default GameChat;