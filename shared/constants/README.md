# 📝 Notation Universelle des Échecs

## Pourquoi la notation anglaise ?

Nous utilisons la **notation algébrique anglaise** (K, Q, R, B, N) qui est le standard universel pour plusieurs raisons importantes :

### ✅ Avantages
- **Universalité** : Reconnue dans le monde entier
- **Compatibilité** : Format PGN standard
- **Interopérabilité** : Échange de parties entre différents logiciels
- **Documentation** : Tous les livres modernes utilisent cette notation

### 📚 Référence
Basé sur la documentation officielle : [Notation des parties d'échecs](https://ecole.apprendre-les-echecs.com/notation-partie-echecs/)

## 🎯 Usage dans le projet

### Classes impactées
- **Move** : Génération automatique de la notation
- **Game** : Historique des coups en notation universelle
- **PGN Export/Import** : Compatibilité totale
- **UI** : Affichage de l'historique

### Exemples d'utilisation

```javascript
import { PIECE_NOTATION, positionToAlgebraic } from './chess-notation.js'

// Mouvement d'un cavalier
const move = PIECE_NOTATION.KNIGHT + 'f3' // "Nf3"

// Position de case
const position = positionToAlgebraic(4, 3) // "e4"

// Roque
const castling = NOTATION_SYMBOLS.CASTLING_KINGSIDE // "O-O"
```

## 🔄 Conversion automatique

Le système gère automatiquement :
- Coordonnées numériques ↔ notation algébrique
- Validation des notations
- Génération des coups complets
- Export PGN standard 