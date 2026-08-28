// ============================================================
// ERNET STORE — Point d'entrée serveur
// ============================================================
import { startServer } from './app.js';

// Démarrage
startServer().catch((err) => {
  console.error('❌ Erreur de démarrage:', err);
  process.exit(1);
});

// Arrêt propre
process.on('SIGINT', () => {
  console.log('\n👋 Arrêt du serveur...');
  process.exit(0);
});
