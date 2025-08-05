# 🏁 AX Chess - Jeu d'Échecs Innovant

![AX Chess Logo](https://via.placeholder.com/400x200/4F46E5/FFFFFF?text=AX+CHESS)

**AX Chess** est un jeu d'échecs en ligne moderne avec des **pouvoirs spéciaux uniques**, développé avec React et Node.js. Découvrez une nouvelle dimension stratégique avec la téléportation, l'invisibilité et l'échange de pièces !

## ✨ Fonctionnalités

### 🎮 Jeu d'Échecs Complet
- ♟️ **Toutes les règles classiques** : roque, en passant, promotion, échec et mat
- 🌍 **Notation algébrique anglaise** universelle (K, Q, R, B, N, P)
- ⏱️ **Contrôles de temps** personnalisables (bullet, blitz, rapid, classic)
- 📊 **Système ELO** avec classements

### ⚡ Pouvoirs Spéciaux Innovants
- 🌀 **Téléportation** : Déplacez une pièce instantanément
- 👻 **Invisibilité** : Rendez une pièce temporairement invisible
- 🔄 **Échange** : Permutez deux pièces sur l'échiquier

### 🌐 Multijoueur Temps Réel
- 🚀 **Socket.IO** pour une expérience fluide
- 👥 **Matchmaking intelligent** basé sur l'ELO
- 💬 **Chat en temps réel** pendant les parties
- 👁️ **Mode spectateur** pour regarder les parties

### 🎨 Personnalisation Avancée
- 🎨 **Thèmes d'échiquier** multiples
- ♛ **Sets de pièces** personnalisés
- 🌈 **Interface moderne** et responsive
- 🔧 **Préférences utilisateur** complètes

### 📈 Progression et Statistiques
- 🏆 **Système de niveaux** et expérience
- 💰 **Monnaie virtuelle** pour débloquer du contenu
- 📊 **Statistiques détaillées** de performance
- 🎖️ **Achievements** et défis

## 🏗️ Architecture Technique

### Backend (Node.js)
```
backend/
├── 🚀 server.js              # Serveur principal Express + Socket.IO
├── 🔐 middleware/auth.js      # Authentification JWT
├── 🗄️ models/                # Modèles MongoDB (User, Game)
├── 🛠️ engine/                # Moteur d'échecs complet
│   ├── board/                 # Classes Board et Pieces
│   ├── moves/                 # Validation des mouvements
│   └── Game.js               # Logique de partie
├── 🌐 api/                   # Routes API REST
│   ├── auth/                 # Authentification
│   ├── game/                 # Gestion des parties
│   └── users/                # Profils utilisateurs
└── 🔌 socket/               # Gestionnaire WebSocket
```

### Frontend (React + TypeScript)
```
frontend/
├── 📱 src/
│   ├── 🧩 components/        # Composants React
│   ├── 📄 pages/            # Pages de l'application
│   ├── 🎮 hooks/            # Hooks personnalisés
│   ├── 🔧 services/         # Services API
│   ├── 🎨 styles/           # Styles CSS/SCSS
│   └── 🔧 utils/            # Utilitaires
└── 📦 public/               # Assets statiques
```

### Base de Données (MongoDB)
- 👤 **Users** : Profils, statistiques, préférences
- 🎮 **Games** : Parties, coups, résultats
- 📊 **Ratings** : Historique ELO
- 🏆 **Achievements** : Succès et défis

## 🚀 Installation et Démarrage

### Prérequis
- Node.js 18+ 
- MongoDB 5+
- npm ou yarn

### 1. Installation des dépendances
```bash
# Installer toutes les dépendances
npm run install-deps

# Ou manuellement :
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configuration
```bash
# Copier le fichier d'environnement
cp backend/.env.example backend/.env

# Configurer les variables :
# - MONGODB_URI
# - JWT_SECRET
# - JWT_REFRESH_SECRET
```

### 3. Démarrage en développement
```bash
# Démarrer backend + frontend simultanément
npm run dev

# Ou séparément :
npm run server  # Backend sur :5000
npm run client  # Frontend sur :3000
```

## 🎯 Utilisation

### Créer un Compte
1. 📝 Inscription avec email/mot de passe
2. ✅ Authentification JWT sécurisée
3. 🎨 Personnalisation du profil

### Jouer une Partie
1. 🎮 **Créer une partie** ou rejoindre le **matchmaking**
2. ⚡ **Utiliser vos pouvoirs** stratégiquement (2 par partie)
3. 🏆 **Gagner des points ELO** et de l'expérience

### Fonctionnalités Avancées
- 📊 Consulter vos **statistiques** détaillées
- 🏅 Suivre votre **progression** dans les classements
- 💬 **Chatter** avec vos adversaires
- 📁 **Exporter** vos parties en PGN

## 🛠️ Technologies Utilisées

### Backend
- **Node.js** + Express.js
- **Socket.IO** (WebSocket temps réel)
- **MongoDB** + Mongoose
- **JWT** (authentification)
- **bcrypt** (hachage mots de passe)

### Frontend
- **React 18** + TypeScript
- **Socket.IO Client**
- **Axios** (API calls)
- **CSS Modules** / **Styled Components**

### DevOps
- **Heroku** (backend)
- **Vercel** (frontend)
- **MongoDB Atlas** (base de données)

## 🎮 Règles des Pouvoirs Spéciaux

### 🌀 Téléportation
- Déplace instantanément une pièce vers n'importe quelle case libre
- Ne peut pas capturer directement
- Utilisable une fois par partie

### 👻 Invisibilité  
- Rend une pièce invisible à l'adversaire pendant 3 tours
- La pièce peut toujours bouger et capturer
- L'adversaire ne voit pas sa position exacte

### 🔄 Échange
- Permute la position de deux pièces alliées
- Conserve les propriétés de chaque pièce
- Stratégique pour sortir d'une situation difficile

## 🏆 Système de Progression

### Niveaux et Expérience
- **+10 XP** par partie jouée
- **+50 XP** par victoire
- **+25 XP** par nulle
- **+100 XP** par achievement débloqué

### Monnaie Virtuelle
- **Coins** gagnés en jouant
- Débloquer des **thèmes** et **sets de pièces**
- Acheter des **boosts** temporaires

## 📊 API Documentation

### Authentification
```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
```

### Parties
```http
POST /api/game/create
POST /api/game/join/:gameId
POST /api/game/:gameId/move
GET  /api/game/:gameId
```

### Utilisateurs
```http
GET  /api/users/leaderboard
GET  /api/users/:userId/stats
GET  /api/users/search
```

## 🧪 Tests

```bash
# Tests backend
cd backend && npm test

# Tests frontend  
cd frontend && npm test

# Tests complets
npm test
```

## 🚀 Déploiement

### Backend (Heroku)
```bash
heroku create ax-chess-api
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=...
git push heroku main
```

### Frontend (Vercel)
```bash
vercel --prod
```

## 🤝 Contribution

1. 🍴 Fork le projet
2. 🌿 Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. 💾 Commit vos changements (`git commit -m 'Add amazing feature'`)
4. 📤 Push vers la branche (`git push origin feature/amazing-feature`)
5. 🔄 Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence **MIT**. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Équipe

- **Développement** : Équipe AX Chess
- **Design** : Interface moderne et intuitive
- **Game Design** : Pouvoirs spéciaux innovants

## 🌟 Roadmap

### Phase 1 ✅ (Actuel)
- [x] Moteur d'échecs complet
- [x] Authentification JWT
- [x] Multijoueur temps réel
- [x] Interface React moderne

### Phase 2 🚧 (En cours)
- [ ] Pouvoirs spéciaux complets
- [ ] Système de tournois
- [ ] Mode entraînement IA
- [ ] Application mobile

### Phase 3 🔮 (Futur)
- [ ] Réalité augmentée
- [ ] Streaming intégré
- [ ] Compétitions esport
- [ ] Marketplace NFT

---

<div align="center">

**🏁 AX Chess - Réinventez les Échecs ! 🏁**

[🌐 Site Web](https://ax-chess.vercel.app) • [📱 App Mobile](https://github.com/ax-chess/mobile) • [💬 Discord](https://discord.gg/ax-chess)

</div>