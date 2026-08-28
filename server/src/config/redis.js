// ============================================================
// ERNET STORE — Client Redis (cache ultra-rapide)
// ============================================================
import Redis from 'ioredis';
import env from './env.js';

/**
 * Client Redis pour le cache et la communication temps réel.
 * Utilisé pour : cache catalogue, taux de change, sessions, pub/sub.
 */
export const redis = new Redis(env.redisUrl, {
  maxRetriesPerRequest: 1,
  lazyConnect: true,
  enableOfflineQueue: false,
  enableReadyCheck: false,
  // Arrête les tentatives de reconnexion quand Redis est indisponible
  retryStrategy: (times) => {
    if (times > 3) return null; // abandonne après 3 tentatives
    return Math.min(times * 500, 2000);
  },
});

let redisWarned = false;
redis.on('connect', () => {
  redisWarned = false;
  console.log('✅ Redis connecté');
});
redis.on('error', () => {
  if (!redisWarned) {
    redisWarned = true;
    console.warn('⚠️ Redis non disponible (le serveur fonctionne sans cache)');
  }
});

/**
 * Helper de cache avec TTL.
 * @param {string} key
 * @param {Function} fetcher - fonction qui retourne les données
 * @param {number} ttl - durée en secondes (défaut 60s)
 */
export async function cacheGet(key, fetcher, ttl = 60) {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch {
    // cache miss, on continue
  }

  const data = await fetcher();
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttl);
  } catch {
    // ignore write errors
  }
  return data;
}

export async function cacheDel(pattern) {
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
}

export default redis;
