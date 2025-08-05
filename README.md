Phase 1 : Le cœur du jeu (Priorité haute)
Cette phase se concentre sur l'essentiel pour avoir un jeu d'échecs fonctionnel avec notation universelle.

⚠️ **Important** : Le projet utilise la **notation algébrique anglaise** (K, Q, R, B, N) selon le standard universel.

1. Moteur de jeu d'échecs
Logique de jeu : Développer un moteur capable de gérer toutes les règles des échecs classiques :

Mouvement des pièces.

Capture des pièces.

Roque (grand et petit).

En passant.

Promotion des pions.

Échec et mat.

Partie nulle (pat, répétition de coups, règle des 50 coups, matériel insuffisant).

Validation des coups : Le moteur doit pouvoir vérifier si un coup est légal ou non.

2. Interface utilisateur et expérience (UI/UX)
Échiquier interactif : Créer une interface visuelle de l'échiquier où les joueurs peuvent déplacer les pièces en les faisant glisser ou en cliquant.

Historique des coups : Afficher la liste des coups joués pendant la partie.

Gestion des états de jeu : Afficher clairement si un joueur est en échec, s'il y a échec et mat, pat, etc.

3. Fonctionnalités multijoueur
Connexion en temps réel : Utiliser Node.js avec Socket.IO pour permettre à deux joueurs de se connecter et de jouer en direct.

Gestion des salons de jeu : Créer un système pour que les joueurs puissent créer ou rejoindre une partie.

Synchronisation des coups : Assurer que les coups joués par un joueur sont instantanément visibles par l'autre.

Phase 2 : Enrichissement et personnalisation (Priorité moyenne)
Une fois le jeu de base stable, vous pouvez ajouter ces fonctionnalités pour le rendre plus attrayant.

1. Pouvoirs spéciaux
Implémentation d'un système de capacités : Chaque joueur peut se voir attribuer aléatoirement (ou choisir) un pouvoir unique avant la partie.

Liste des capacités à implémenter :

Téléportation : Permet de déplacer une tour ou un cavalier à un endroit valide sur l'échiquier une fois par partie.

Invisibilité : Rend un pion invisible pour un tour, le protégeant de toutes les captures.

Échange : Échange la position de deux de ses pièces.

Interface des capacités : Ajouter un bouton ou une icône pour activer le pouvoir, qui devient grisé après utilisation.

2. Système de progression et de classement
Base de données des joueurs : Gérer les comptes utilisateurs (identifiants, mots de passe).

Expérience et niveaux : Développer un système d'expérience où chaque partie jouée et gagnée rapporte des points, faisant monter les joueurs de niveau.

Classement ELO : Mettre en place un système de classement pour que les joueurs puissent suivre leur progression et se mesurer à d'autres.

3. Personnalisation
Magasin en jeu : Permettre aux joueurs de dépenser leur expérience pour débloquer de nouveaux designs de pièces et de plateaux.

Stockage des préférences : Sauvegarder les personnalisations des joueurs pour qu'elles soient conservées entre les parties.

Phase 3 : Variantes de jeu et événements (Priorité basse)
Ces ajouts peuvent être développés une fois que le jeu est bien établi et que la communauté de joueurs commence à grandir.

1. Modes de jeu alternatifs
Échecs 960 (Fischer) : Modifier la position de départ des pièces de manière aléatoire.

Échecs atomiques : Coder la logique d'explosion des pièces adjacentes.

Échecs de la Horde : Créer une variante avec un joueur contre une armée de pions.

2. Événements aléatoires
Météo et brouillard de guerre : Implémenter un système qui rend certaines cases invisibles ou réduit la visibilité pendant quelques tours.

Cartes de l'Échiquier : À intervalles réguliers (par exemple, tous les 10 tours), tirer une carte avec un effet prédéfini (ex : un pion est déplacé d'une case aléatoire).