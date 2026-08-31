// ============================================================
// ERNET STORE — Module ETL : Script Orchestrateur CLI
// ============================================================
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCatalogExcel } from './excel-parser.js';
import { dispatchBatchesToQueue, catalogQueue, redisConnection } from './queue.js';
import { catalogWorker } from './worker.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

async function findExcelFiles(target) {
  if (target && fs.existsSync(target)) {
    return [path.resolve(target)];
  }
  if (fs.existsSync(UPLOADS_DIR)) {
    const files = await fs.promises.readdir(UPLOADS_DIR);
    return files
      .filter((f) => /\.(xlsx|xls)$/i.test(f))
      .map((f) => path.join(UPLOADS_DIR, f));
  }
  return [];
}

async function run() {
  const targetArg = process.argv[2];
  const files = await findExcelFiles(targetArg);

  if (!files.length) {
    console.error('❌ Aucun fichier Excel trouvé. Déposez vos fichiers dans server/uploads/ ou spécifiez le chemin :');
    console.error('   node src/etl/run-etl.js /chemin/vers/catalogue.xlsx');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('🚀 ERNET STORE — Pipeline ETL B2B ExcelJS -> PostgreSQL & Meilisearch');
  console.log(`📁 Fichiers à traiter (${files.length}) :`, files.map((f) => path.basename(f)).join(', '));
  console.log('='.repeat(60));

  const startTime = Date.now();

  try {
    let totalImported = 0;

    for (const file of files) {
      console.log(`\n📄 Lecture et extraction de : ${path.basename(file)}`);
      const products = await parseCatalogExcel(file, path.join(UPLOADS_DIR, 'products'));

      if (products.length > 0) {
        totalImported += products.length;
        await dispatchBatchesToQueue(products, 100);
      }
    }

    console.log(`\n⏳ Tous les lots (${totalImported} produits) ont été envoyés dans Redis.`);
    console.log('🔄 Attente de la finalisation du worker...');

    // Attendre que la file soit vide
    const checkInterval = setInterval(async () => {
      const counts = await catalogQueue.getJobCounts('waiting', 'active', 'delayed');
      if (counts.waiting === 0 && counts.active === 0) {
        clearInterval(checkInterval);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`\n✨ Synchronisation ETL terminée avec succès en ${duration}s !`);
        await catalogWorker.close();
        await catalogQueue.close();
        await redisConnection.quit();
        process.exit(0);
      }
    }, 1500);
  } catch (err) {
    console.error('❌ Erreur critique ETL:', err);
    await catalogWorker.close();
    await catalogQueue.close();
    await redisConnection.quit();
    process.exit(1);
  }
}

run();
