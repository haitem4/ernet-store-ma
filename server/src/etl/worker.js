// ============================================================
// ERNET STORE — Module ETL : Worker BullMQ (PostgreSQL & Meilisearch)
// ============================================================
import { Worker } from 'bullmq';
import { redisConnection, CATALOG_QUEUE_NAME } from './queue.js';
import prisma from '../config/prisma.js';
import { meili, PRODUCTS_INDEX } from '../config/meilisearch.js';
import { slugify } from './excel-parser.js';

/**
 * Traitement d'un lot de produits
 * 1. Upsert dans PostgreSQL via Prisma
 * 2. Synchronisation instantanée dans Meilisearch
 */
export async function processCatalogBatch(job) {
  const { batchIndex, products } = job.data;
  console.log(`[ETL Worker] Traitement du lot #${batchIndex} (${products.length} produits)...`);

  const meiliDocuments = [];
  const errors = [];

  for (const item of products) {
    try {
      const brandSlug = slugify(item.brand || 'Autre');
      const categorySlug = slugify(item.category || 'Général');

      // 1. Upsert Marque & Catégorie
      const [brand, category] = await prisma.$transaction([
        prisma.brand.upsert({
          where: { slug: brandSlug },
          update: { name: item.brand || 'Autre' },
          create: { name: item.brand || 'Autre', slug: brandSlug },
        }),
        prisma.category.upsert({
          where: { slug: categorySlug },
          update: { name: item.category || 'Général' },
          create: { name: item.category || 'Général', slug: categorySlug },
        }),
      ]);

      // 2. Upsert Produit avec SKU comme clé unique
      const savedProduct = await prisma.product.upsert({
        where: { sku: item.sku },
        update: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          brandId: brand.id,
          categoryId: category.id,
          price: item.price,
          costPrice: item.costPrice,
          compareAt: item.catalogPrice > item.price ? item.catalogPrice : null,
          stock: item.stock,
          specs: item.specs || {},
          images: item.images && item.images.length > 0 ? item.images : undefined,
          supplier: item.supplier || 'Disway',
          supplierRef: item.supplierRef || item.sku,
          status: item.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
          lastSyncAt: new Date(),
        },
        create: {
          sku: item.sku,
          name: item.name,
          slug: item.slug,
          description: item.description,
          brandId: brand.id,
          categoryId: category.id,
          price: item.price,
          costPrice: item.costPrice,
          compareAt: item.catalogPrice > item.price ? item.catalogPrice : null,
          stock: item.stock,
          specs: item.specs || {},
          images: item.images || [],
          supplier: item.supplier || 'Disway',
          supplierRef: item.supplierRef || item.sku,
          status: item.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
          lastSyncAt: new Date(),
        },
      });

      // 3. Document Meilisearch formaté
      meiliDocuments.push({
        id: savedProduct.id,
        sku: savedProduct.sku,
        name: savedProduct.name,
        slug: savedProduct.slug,
        description: savedProduct.description,
        brand: brand.name,
        category: category.name,
        subCategory: item.subCategory,
        price: parseFloat(savedProduct.price.toString()),
        costPrice: parseFloat(savedProduct.costPrice?.toString() || '0'),
        stock: savedProduct.stock,
        status: savedProduct.status,
        specs: savedProduct.specs,
        images: savedProduct.images,
        createdAt: savedProduct.createdAt.getTime(),
      });
    } catch (err) {
      console.error(`[ETL Worker] Erreur SKU ${item.sku}:`, err.message);
      errors.push({ sku: item.sku, error: err.message });
    }
  }

  // 4. Synchronisation Meilisearch par lot
  if (meiliDocuments.length > 0) {
    try {
      await meili.index(PRODUCTS_INDEX).addDocuments(meiliDocuments, { primaryKey: 'id' });
    } catch (meiliErr) {
      console.warn(`[ETL Worker] Meilisearch non synchronisé pour lot #${batchIndex}:`, meiliErr.message);
    }
  }

  console.log(`[ETL Worker] ✅ Lot #${batchIndex} terminé (${meiliDocuments.length} upsertés, ${errors.length} erreurs).`);
  return { processed: meiliDocuments.length, errors: errors.length };
}

// Initialisation du worker BullMQ (Concurrence: 4)
export const catalogWorker = new Worker(CATALOG_QUEUE_NAME, processCatalogBatch, {
  connection: redisConnection,
  concurrency: 4,
});

catalogWorker.on('completed', (job) => {
  console.log(`[ETL Worker] Lot ${job.id} traité avec succès.`);
});

catalogWorker.on('failed', (job, err) => {
  console.error(`[ETL Worker] ❌ Échec sur lot ${job?.id}:`, err.message);
});
