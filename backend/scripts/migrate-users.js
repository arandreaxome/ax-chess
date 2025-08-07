/**
 * Script de migration pour mettre à jour la structure des utilisateurs existants
 * Exécuter avec: node scripts/migrate-users.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connexion à MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connexion à MongoDB établie');
  } catch (error) {
    console.error('❌ Erreur de connexion à MongoDB:', error);
    process.exit(1);
  }
};

/**
 * Migration des utilisateurs vers la nouvelle structure
 */
const migrateUsers = async () => {
  try {
    console.log('🔄 Début de la migration des utilisateurs...');

    // Récupérer tous les utilisateurs
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`📊 ${users.length} utilisateurs trouvés`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const updates = {};

        // Migrer les statistiques vers la nouvelle structure
        if (!user.stats || !user.stats.rating) {
          updates['stats.rating'] = {
            bullet: user.rating?.current || 1200,
            blitz: user.rating?.current || 1200,
            rapid: user.rating?.current || 1200,
            classic: user.rating?.current || 1200
          };
        }

        if (!user.stats || !user.stats.games) {
          updates['stats.games'] = {
            total: user.stats?.gamesPlayed || 0,
            won: user.stats?.gamesWon || 0,
            lost: user.stats?.gamesLost || 0,
            drawn: user.stats?.gamesDraw || 0
          };
        }

        if (!user.stats || user.stats.winRate === undefined) {
          const total = user.stats?.gamesPlayed || 0;
          const won = user.stats?.gamesWon || 0;
          updates['stats.winRate'] = total > 0 ? Math.round((won / total) * 100) : 0;
        }

        if (!user.stats || user.stats.averageRating === undefined) {
          updates['stats.averageRating'] = user.rating?.current || 1200;
        }

        if (!user.stats || !user.stats.achievements) {
          updates['stats.achievements'] = [];
        }

        // Migrer le profil vers la nouvelle structure
        if (!user.profile || user.profile.level === undefined) {
          updates['profile.level'] = user.progression?.level || 1;
        }

        if (!user.profile || user.profile.experience === undefined) {
          updates['profile.experience'] = user.progression?.experience || 0;
        }

        if (!user.profile || user.profile.coins === undefined) {
          updates['profile.coins'] = user.progression?.coins || 100;
        }

        if (!user.profile || user.profile.title === undefined) {
          updates['profile.title'] = null;
        }

        // Migrer les préférences vers la nouvelle structure
        if (!user.preferences || user.preferences.theme === undefined) {
          updates['preferences.theme'] = 'auto';
        }

        if (!user.preferences || user.preferences.notificationsEnabled === undefined) {
          updates['preferences.notificationsEnabled'] = true;
        }

        if (!user.preferences || user.preferences.showLegalMoves === undefined) {
          updates['preferences.showLegalMoves'] = true;
        }

        if (!user.preferences || user.preferences.animationSpeed === undefined) {
          updates['preferences.animationSpeed'] = 'normal';
        }

        // Appliquer les mises à jour si nécessaire
        if (Object.keys(updates).length > 0) {
          await mongoose.connection.db.collection('users').updateOne(
            { _id: user._id },
            { $set: updates }
          );
          migratedCount++;
          console.log(`✅ Utilisateur ${user.username} migré`);
        }

      } catch (error) {
        console.error(`❌ Erreur lors de la migration de l'utilisateur ${user.username}:`, error);
        errorCount++;
      }
    }

    console.log(`\n📈 Migration terminée:`);
    console.log(`   ✅ ${migratedCount} utilisateurs migrés`);
    console.log(`   ❌ ${errorCount} erreurs`);
    console.log(`   📊 ${users.length - migratedCount - errorCount} utilisateurs déjà à jour`);

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  }
};

/**
 * Fonction principale
 */
const main = async () => {
  await connectDB();
  await migrateUsers();
  await mongoose.connection.close();
  console.log('👋 Migration terminée, connexion fermée');
};

// Exécution du script
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { migrateUsers };
