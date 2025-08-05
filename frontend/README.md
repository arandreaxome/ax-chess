# AX Chess Frontend

Interface utilisateur React pour AX Chess - Le jeu d'échecs réinventé avec des pouvoirs spéciaux.

## 🚀 Technologies

- **React 19** avec TypeScript
- **Socket.IO Client** pour le temps réel
- **Axios** pour les appels API
- **React Router** pour la navigation
- **CSS Modules** pour les styles

## 📦 Installation

```bash
# Installer les dépendances
npm install

# Démarrer en mode développement
npm start

# Construire pour la production
npm run build

# Lancer les tests
npm test
```

## 🏗️ Structure du projet

```
src/
├── components/          # Composants React réutilisables
│   ├── auth/           # Composants d'authentification
│   ├── chess/          # Composants de l'échiquier
│   ├── game/           # Composants de jeu
│   ├── layout/         # Composants de mise en page
│   └── ui/             # Composants d'interface
├── contexts/           # Contextes React (Auth, Game)
├── hooks/              # Hooks personnalisés
├── pages/              # Pages de l'application
├── services/           # Services (API, Socket.IO)
├── styles/             # Styles globaux
├── types/              # Types TypeScript
└── utils/              # Utilitaires
```

## 🎮 Fonctionnalités

### ✅ Implémentées
- 🔐 **Authentification complète** (inscription, connexion, profil)
- ♟️ **Échiquier interactif** avec drag & drop
- 🌐 **Communication temps réel** via WebSocket
- 💬 **Chat en direct** pendant les parties
- 📊 **Informations de partie** et statistiques
- 🎨 **Interface moderne** et responsive
- 📱 **Design mobile-first**

### 🚧 En développement
- ⚡ **Pouvoirs spéciaux** (téléportation, invisibilité, échange)
- 🤖 **Mode entraînement** contre l'IA
- 🏆 **Système de tournois**
- 📈 **Analyses de parties**

## 🎨 Design System

### Couleurs principales
- **Primaire** : `#4f46e5` (Indigo)
- **Secondaire** : `#7c3aed` (Violet)
- **Accent** : `#f59e0b` (Ambre)
- **Succès** : `#10b981` (Émeraude)
- **Erreur** : `#ef4444` (Rouge)

### Typographie
- **Police principale** : Segoe UI, système
- **Police monospace** : Courier New (pour les notations d'échecs)

## 🔧 Configuration

### Variables d'environnement

Copiez `.env.example` vers `.env` et configurez :

```bash
# URL de l'API backend
REACT_APP_API_URL=http://localhost:5000

# Configuration optionnelle
REACT_APP_NAME=AX Chess
REACT_APP_VERSION=1.0.0
PORT=3000
```

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests avec couverture
npm test -- --coverage

# Tests en mode watch
npm test -- --watch
```

## 📱 Responsive Design

L'application est optimisée pour :
- 📱 **Mobile** (320px+)
- 📟 **Tablette** (768px+)
- 💻 **Desktop** (1024px+)
- 🖥️ **Large Desktop** (1440px+)

## 🎯 Points d'entrée

- `/` - Page d'accueil
- `/login` - Authentification
- `/game/:gameId` - Partie en cours
- `/profile` - Profil utilisateur

## 🔗 Intégration Backend

Le frontend communique avec le backend via :
- **API REST** pour les opérations CRUD
- **WebSocket** pour le temps réel (parties, chat)
- **Authentification JWT** avec refresh tokens

## 🚀 Déploiement

### Production

```bash
# Build optimisé
npm run build

# Les fichiers sont dans build/
# Servir avec un serveur web statique
```

### Vercel (recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel --prod
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/amazing-feature`)
3. Commit (`git commit -m 'Add amazing feature'`)
4. Push (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT - Voir le fichier [LICENSE](../LICENSE) pour plus de détails.
