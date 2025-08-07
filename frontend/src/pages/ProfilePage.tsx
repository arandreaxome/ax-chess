import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="profile-page">
        <div className="profile-error">
          <h2>Erreur</h2>
          <p>Impossible de charger le profil utilisateur.</p>
        </div>
      </div>
    );
  }

  const winRate = (user?.stats?.games?.total || 0) > 0 ? 
    Math.round(((user?.stats?.games?.won || 0) / (user?.stats?.games?.total || 1)) * 100) : 0;

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* En-tête du profil */}
        <div className="profile-header">
          <div className="profile-avatar">
            {user?.username?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="profile-info">
            <h1>{user?.username || 'Utilisateur'}</h1>
            <p className="profile-email">{user?.email || 'email@exemple.com'}</p>
            <div className="profile-badges">
              <span className="badge badge--level">Niveau {user?.profile?.level || 1}</span>
              {user?.profile?.title && (
                <span className="badge badge--title">{user?.profile?.title}</span>
              )}
            </div>
          </div>
        </div>

        {/* Statistiques principales */}
        <div className="stats-section">
          <h2>Statistiques</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <span className="stat-value">{user?.stats?.games?.won || 0}</span>
                <span className="stat-label">Victoires</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <span className="stat-value">{user?.stats?.games?.total || 0}</span>
                <span className="stat-label">Parties</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <span className="stat-value">{winRate}%</span>
                <span className="stat-label">Taux de victoire</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <span className="stat-value">{user?.stats?.averageRating || 1200}</span>
                <span className="stat-label">Rating moyen</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ratings par format */}
        <div className="ratings-section">
          <h2>Classements</h2>
          <div className="ratings-grid">
            <div className="rating-item">
              <span className="rating-type">⚡ Bullet</span>
              <span className="rating-value">{user.stats?.rating?.bullet || 1200}</span>
            </div>
            
            <div className="rating-item">
              <span className="rating-type">🏃 Blitz</span>
              <span className="rating-value">{user.stats?.rating?.blitz || 1200}</span>
            </div>
            
            <div className="rating-item">
              <span className="rating-type">🚀 Rapide</span>
              <span className="rating-value">{user.stats?.rating?.rapid || 1200}</span>
            </div>
            
            <div className="rating-item">
              <span className="rating-type">🎯 Classique</span>
              <span className="rating-value">{user.stats?.rating?.classic || 1200}</span>
            </div>
          </div>
        </div>

        {/* Progression */}
        <div className="progression-section">
          <h2>Progression</h2>
          <div className="progression-content">
            <div className="xp-progress">
              <div className="xp-info">
                <span>Expérience</span>
                <span>{user?.profile?.experience || 0} XP</span>
              </div>
              <div className="xp-bar">
                <div 
                  className="xp-fill"
                  style={{ 
                    width: `${((user?.profile?.experience || 0) % 1000) / 10}%` 
                  }}
                />
              </div>
              <div className="xp-level-info">
                <span>Niveau {user?.profile?.level || 1}</span>
                <span>Prochain niveau : {1000 - ((user?.profile?.experience || 0) % 1000)} XP</span>
              </div>
            </div>
            
            <div className="coins-info">
              <div className="coins-display">
                <span className="coins-icon">🪙</span>
                <span className="coins-amount">{user?.profile?.coins || 0}</span>
                <span className="coins-label">Pièces d'or</span>
              </div>
            </div>
          </div>
        </div>

        {/* Succès */}
        <div className="achievements-section">
          <h2>Succès</h2>
          <div className="achievements-grid">
            {(user?.stats?.achievements?.length || 0) === 0 ? (
              <p className="no-achievements">
                Aucun succès débloqué pour le moment. Continuez à jouer !
              </p>
            ) : (
              (user?.stats?.achievements || []).map((achievement) => (
                <div key={achievement.id} className={`achievement achievement--${achievement.rarity}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-info">
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                    <span className="achievement-date">
                      Débloqué le {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Informations du profil */}
        {user?.profile?.bio && (
          <div className="bio-section">
            <h2>À propos</h2>
            <p className="bio-text">{user?.profile?.bio}</p>
          </div>
        )}

        {/* Actions */}
        <div className="profile-actions">
          <button className="action-button action-button--secondary">
            ✏️ Modifier le profil
          </button>
          <button className="action-button action-button--tertiary">
            📊 Voir les statistiques détaillées
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;