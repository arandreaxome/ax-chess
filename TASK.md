# 📋 Tâches de Développement - AX Chess

*Dernière mise à jour : 2024-12-19*

## 🚀 Phase 1 : Le cœur du jeu (Priorité HAUTE)

### 📦 Setup et Infrastructure
- [ ] **Setup initial du projet** - 2024-12-19
  - [ ] Initialiser le projet Node.js avec package.json
  - [ ] Configurer ESLint + Prettier avec JavaScript Standard Style
  - [ ] Installer dépendances de base (Express, Socket.IO)
  - [ ] Créer structure de dossiers selon PLANNING.md
  - [ ] Configurer Git avec gitmoji
  - [ ] Setup environnements (.env.example)

- [ ] **Configuration base de données**
  - [ ] Setup PostgreSQL avec Docker Compose
  - [ ] Configurer ORM (Sequelize ou Prisma)
  - [ ] Créer migrations de base (users, games, moves)
  - [ ] Seeds de test

### 🎯 Moteur de jeu d'échecs

#### Core Engine
- [ ] **Classes de base**
  - [ ] Créer classe `Board` (représentation 8x8 avec coordonnées a1-h8)
  - [ ] Créer classe abstraite `Piece` avec propriétés communes
  - [ ] Implémenter classes spécifiques : `Pawn`, `Rook`, `Knight`, `Bishop`, `Queen`, `King`
  - [ ] Créer classe `Position` pour coordonnées (format a1-h8)
  - [ ] Créer enum `PieceColor` et `PieceType` avec notation anglaise (K,Q,R,B,N)

- [ ] **Mouvement des pièces** 
  - [ ] Logique de mouvement pour chaque type de pièce
  - [ ] Classe `Move` avec from/to positions
  - [ ] Méthode `getPossibleMoves()` pour chaque pièce
  - [ ] Validation des mouvements de base
  - [ ] Tests unitaires pour chaque type de mouvement

- [ ] **Capture des pièces**
  - [ ] Logique de capture dans les mouvements
  - [ ] Méthode `isSquareOccupied()`
  - [ ] Méthode `canCapture()`
  - [ ] Historique des pièces capturées

#### Règles Spéciales
- [ ] **Roque (castling)**
  - [ ] Détecter conditions de roque (roi/tour non bougés, pas d'échec)
  - [ ] Implémenter grand et petit roque
  - [ ] Valider chemin libre entre roi et tour
  - [ ] Tests pour toutes les conditions d'invalidité

- [ ] **En passant**
  - [ ] Détecter mouvement de pion de 2 cases
  - [ ] Stocker état "en passant" pour le tour suivant
  - [ ] Valider et exécuter capture en passant
  - [ ] Nettoyer état en passant après chaque tour

- [ ] **Promotion des pions**
  - [ ] Détecter pion atteignant dernière rangée
  - [ ] Interface de choix de promotion
  - [ ] Remplacer pion par pièce choisie
  - [ ] Promotion automatique en Dame par défaut

#### États de jeu
- [ ] **Échec et mat**
  - [ ] Détecter si roi est en échec
  - [ ] Calculer tous mouvements légaux
  - [ ] Détecter échec et mat (aucun mouvement légal)
  - [ ] Classe `GameState` avec énumérations

- [ ] **Partie nulle**
  - [ ] Pat (roi pas en échec mais aucun mouvement légal)
  - [ ] Répétition de position (3x)
  - [ ] Règle des 50 coups
  - [ ] Matériel insuffisant
  - [ ] Accord mutuel

#### Validation
- [ ] **Classe `MoveValidator`**
  - [ ] Méthode `isMoveLegal()` principale
  - [ ] Vérifier que mouvement ne met pas son roi en échec
  - [ ] Intégrer toutes les règles spéciales
  - [ ] Optimiser performance des calculs

### 🎨 Interface Utilisateur

#### Échiquier visuel
- [ ] **Rendu de l'échiquier**
  - [ ] HTML/CSS pour échiquier 8x8
  - [ ] Sprites des pièces (SVG recommandé)
  - [ ] Alternance couleurs cases
  - [ ] Responsive design

- [ ] **Interactions utilisateur**
  - [ ] Drag & drop des pièces
  - [ ] Click to move (alternative)
  - [ ] Highlight des mouvements possibles
  - [ ] Animations fluides des mouvements
  - [ ] Feedback visuel (échec, mat, etc.)

- [ ] **États visuels**
  - [ ] Highlighting du roi en échec
  - [ ] Indication tour du joueur
  - [ ] Dernière case jouée highlighted
  - [ ] Animation de capture
  - [ ] Modal de promotion de pion

#### Interface de jeu
- [ ] **Historique des coups**
  - [ ] Panneau latéral avec notation algébrique anglaise (K,Q,R,B,N)
  - [ ] Navigation dans l'historique avec format standard
  - [ ] Export PGN de la partie (format universel)
  - [ ] Import PGN pour rejouer des parties

- [ ] **Informations de partie**
  - [ ] Timer par joueur (si activé)
  - [ ] Pièces capturées par camp
  - [ ] Statut de la partie
  - [ ] Boutons abandon/nulle

### 🌐 Multijoueur Temps Réel

#### Socket.IO Setup
- [ ] **Configuration serveur**
  - [ ] Setup Socket.IO côté serveur
  - [ ] Gestion des connexions/déconnexions
  - [ ] Middleware d'authentification
  - [ ] Gestion des erreurs

- [ ] **Événements de base**
  - [ ] `connection` / `disconnect`
  - [ ] `game:join` / `game:leave`
  - [ ] `game:move` / `game:move-response`
  - [ ] `game:state` / `game:update`

#### Gestion des salons
- [ ] **Classe `GameRoom`**
  - [ ] Créer/rejoindre salon
  - [ ] Maximum 2 joueurs par salon
  - [ ] Attribution couleurs
  - [ ] Liste des salons publics

- [ ] **Matchmaking simple**
  - [ ] Queue de joueurs en attente
  - [ ] Appariement automatique
  - [ ] Salon privé avec code d'invitation

#### Synchronisation
- [ ] **État de jeu partagé**
  - [ ] Synchroniser état échiquier
  - [ ] Validation côté serveur obligatoire
  - [ ] Broadcast des mouvements
  - [ ] Gestion reconnexion

## 🎉 Phase 2 : Enrichissement et personnalisation (Priorité MOYENNE)

### ⚡ Système de Pouvoirs Spéciaux

#### Architecture des pouvoirs
- [ ] **Classe `Power` abstraite**
  - [ ] Propriétés : nom, description, usages
  - [ ] Méthode abstraite `execute()`
  - [ ] Méthode `canUse()` pour conditions
  - [ ] Cooldown système

- [ ] **Implémentation des pouvoirs**
  - [ ] **Téléportation** : Déplacer tour/cavalier instantanément
  - [ ] **Invisibilité** : Pion invisible pendant 1 tour
  - [ ] **Échange** : Swap position de 2 pièces alliées
  - [ ] Interface d'activation des pouvoirs
  - [ ] Effets visuels pour chaque pouvoir

#### Gestion des pouvoirs
- [ ] **Classe `PowerManager`**
  - [ ] Attribution aléatoire en début de partie
  - [ ] Validation utilisation côté serveur
  - [ ] Historique des pouvoirs utilisés
  - [ ] Balance des pouvoirs (tests)

### 👤 Système Utilisateurs et Progression

#### Authentification
- [ ] **API Auth**
  - [ ] Inscription/connexion
  - [ ] JWT + refresh tokens
  - [ ] Middleware d'authentification
  - [ ] Validation email (optionnel)

- [ ] **Gestion profils**
  - [ ] CRUD utilisateurs
  - [ ] Avatar/pseudonyme
  - [ ] Statistiques personnelles

#### Progression et Classement
- [ ] **Système XP**
  - [ ] Points par partie jouée/gagnée
  - [ ] Calcul niveau basé sur XP
  - [ ] Bonus première victoire quotidienne

- [ ] **Classement ELO**
  - [ ] Implémentation algorithme ELO
  - [ ] Calcul gains/pertes par partie
  - [ ] Leaderboard global
  - [ ] Historique ELO personnel

### 🎨 Personnalisation

#### Magasin en jeu
- [ ] **Système monétaire**
  - [ ] Monnaie virtuelle (pièces d'or)
  - [ ] Gains par parties/achievements
  - [ ] Prix des objets cosmétiques

- [ ] **Catalogue items**
  - [ ] Skins de pièces d'échecs
  - [ ] Thèmes d'échiquier
  - [ ] Effets de particules
  - [ ] Système de déverrouillage

## 🌟 Phase 3 : Variantes et Événements (Priorité BASSE)

### 🎲 Modes de Jeu Alternatifs

#### Échecs 960 (Fischer)
- [ ] **Génération position aléatoire**
  - [ ] Algorithme génération positions valides
  - [ ] Contraintes : évêques couleurs opposées, roi entre tours
  - [ ] Adaptation règles de roque
  - [ ] Interface sélection mode

#### Échecs Atomiques
- [ ] **Logique explosion**
  - [ ] Explosion lors des captures
  - [ ] Destruction pièces adjacentes (sauf pions)
  - [ ] Conditions victoire modifiées
  - [ ] Effets visuels explosions

#### Échecs de la Horde
- [ ] **Setup asymétrique**
  - [ ] Joueur normal vs armée de pions
  - [ ] Balance du gameplay
  - [ ] Conditions victoire spéciales

### 🌦️ Événements Aléatoires

#### Système d'événements
- [ ] **Classe `RandomEvent`**
  - [ ] Déclenchement aléatoire/périodique
  - [ ] Pool d'événements disponibles
  - [ ] Animation/notification événements

#### Types d'événements
- [ ] **Météo et brouillard**
  - [ ] Cases deviennent invisibles
  - [ ] Vision limitée temporaire
  - [ ] Interface avec overlay brouillard

- [ ] **Cartes d'échiquier**
  - [ ] Deck de cartes d'événements
  - [ ] Effets : déplacement pièces, bonus temporaires
  - [ ] Animation cartes tirées

---

## 📋 Découvertes Pendant le Développement

*Cette section sera mise à jour au fur et à mesure*

---

## ✅ Tâches Terminées

*Les tâches complétées seront déplacées ici avec date de completion*

---

## 📝 Notes de Développement

### Conventions à respecter
- Fichiers max 500 lignes
- JSDoc obligatoire
- Tests pour chaque nouvelle feature
- Git commit avec gitmoji
- Code review avant merge

### Ordre de priorité recommandé
1. Setup infrastructure
2. Moteur de jeu complet (sans UI)
3. Interface basique mais fonctionnelle
4. Multijoueur simple
5. Polish et optimisations Phase 1
6. Puis Phase 2, etc. 