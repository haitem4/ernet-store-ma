// Import manuel Disway depuis server/uploads/latest.xlsx.
// Toute la logique de parsing et de synchronisation vit dans le service actif.
import { syncDiswayCatalog } from './src/services/disway.service.js';

console.log('📦 Import Disway depuis le fichier local…');

try {
  const result = await syncDiswayCatalog({ localOnly: true });
  console.log('✅ Import terminé:', JSON.stringify(result));
} catch (err) {
  console.error('❌ Import Disway échoué:', err.message);
  process.exitCode = 1;
}
