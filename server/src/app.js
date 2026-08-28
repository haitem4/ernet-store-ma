// ============================================================
// ERNET STORE — Application Express
// ============================================================
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import env from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { initSocket } from './socket/index.js';
import { initMeilisearch } from './config/meilisearch.js';
import { syncDiswayCatalog } from './services/disway.service.js';

const app = express();

// Faire confiance au proxy inverse (nécessaire pour un rate limiting par IP fiable)
app.set('trust proxy', 1);

// Sécurité : en-têtes HTTP
app.use(
  helmet({
    contentSecurityPolicy: env.nodeEnv === 'production' ? undefined : false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS strict : liste d'origines autorisées
const allowedOrigins = env.clientUrl.split(',').map((o) => o.trim());
app.use(
  cors({
    origin(origin, callback) {
      // Autoriser les requêtes sans origine (curl, mobile, etc.)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
  })
);

// Parser JSON avec une limite raisonnable
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting global sur l'API
app.use('/api', apiLimiter);

// Logging simple en dev
if (env.nodeEnv === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Routes API
app.use('/api', routes);

// Images produit (scrapées depuis Disway)
import { fileURLToPath as fu2p } from 'url';
import path from 'path';
const __uploadDir = path.join(path.dirname(fu2p(import.meta.url)), '..', '..', 'uploads');
app.use(
  '/uploads/products',
  express.static(path.join(__uploadDir, 'products'), {
    maxAge: '30d',
    immutable: true,
  })
);

// Gestion d'erreurs
app.use(notFound);
app.use(errorHandler);

// Serveur HTTP + Socket.IO
export const httpServer = createServer(app);

function scheduleMonthlySync(task, time = '04:00') {
  const [hour, minute] = time.split(':').map(Number);

  const scheduleNext = () => {
    const now = new Date();
    let nextRun = new Date(now.getFullYear(), now.getMonth(), 1, hour, minute, 0, 0);

    // Si la date/heure du 1er de ce mois est déjà passée, on programme pour le mois prochain.
    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    console.log(
      `[Scheduler] Prochaine synchronisation mensuelle Disway programmée pour le ${nextRun.toLocaleString('fr-FR')}`
    );

    setTimeout(() => {
      console.log(`[Scheduler] Démarrage de la tâche de synchronisation mensuelle Disway...`);
      task().catch((err) => {
        console.error('❌ Erreur lors de la synchronisation mensuelle Disway:', err);
      });
      // Une fois la tâche exécutée, on programme la suivante.
      scheduleNext();
    }, delay);
  };

  scheduleNext();
}

export async function startServer() {
  initSocket(httpServer);
  await initMeilisearch();

  if (env.diswayAutoSync) {
    console.log('⏱️ Disway auto-sync activé');

    const runSyncWithInterval = async () => {
      try {
        await syncDiswayCatalog();
      } catch (err) {
        console.error('❌ Erreur lors de la synchronisation automatique Disway:', err);
      } finally {
        if (env.diswaySyncIntervalMs > 0) {
          setTimeout(runSyncWithInterval, env.diswaySyncIntervalMs);
        }
      }
    };
    runSyncWithInterval();
  }

  if (env.diswayAutoSyncMonthly) {
    console.log('📅 Disway monthly sync activé');
    scheduleMonthlySync(syncDiswayCatalog, env.diswayAutoSyncTime);
  }

  httpServer.listen(env.port, () => {
    console.log(`🚀 ERNET STORE API démarrée sur http://localhost:${env.port}`);
    console.log(`🌐 Environnement: ${env.nodeEnv}`);
    console.log(`📡 Socket.IO prêt pour le temps réel`);
  });
}

export default app;
