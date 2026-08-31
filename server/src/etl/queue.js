// ============================================================
// ERNET STORE — Module ETL : File d'attente Redis BullMQ
// ============================================================
import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import env from '../config/env.js';

export const redisConnection = new IORedis(env.redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const CATALOG_QUEUE_NAME = 'catalog-import';

export const catalogQueue = new Queue(CATALOG_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
});

/**
 * Pousse les produits par lots (batches) dans la queue BullMQ
 */
export async function dispatchBatchesToQueue(products, batchSize = 100) {
  const jobs = [];
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    jobs.push({
      name: `import-batch-${batchNumber}`,
      data: {
        batchIndex: batchNumber,
        totalItems: batch.length,
        products: batch,
      },
    });
  }

  await catalogQueue.addBulk(jobs);
  console.log(`[ETL Queue] 🚀 ${jobs.length} lots ajoutés à Redis (Total: ${products.length} produits).`);
}
