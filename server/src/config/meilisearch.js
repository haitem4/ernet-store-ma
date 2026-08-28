// ============================================================
// ERNET STORE — Client Meilisearch (recherche ultra-rapide)
// ============================================================
import { MeiliSearch } from 'meilisearch';
import env from './env.js';

export const meili = new MeiliSearch({
  host: env.meilisearchHost,
  apiKey: env.meilisearchKey,
});

export const PRODUCTS_INDEX = 'products';

/**
 * Initialise les index Meilisearch avec les filtres de recherche.
 */
export async function initMeilisearch() {
  try {
    await meili.createIndex(PRODUCTS_INDEX, { primaryKey: 'id' }).catch((err) => {
      if (!/already exists/i.test(err.message)) throw err;
    });
    const index = meili.index(PRODUCTS_INDEX);

    // Champs filtrables (filtres multicritères)
    await index.updateFilterableAttributes(['brand', 'category', 'price', 'stock', 'status']);

    // Champs triables
    await index.updateSortableAttributes(['price', 'createdAt']);

    // Synthétiseur de recherche français
    await index.updateSettings({
      searchableAttributes: ['name', 'brand', 'description', 'category', 'sku'],
      filterableAttributes: ['brand', 'category', 'price', 'stock', 'status'],
      sortableAttributes: ['price', 'createdAt'],
      rankingRules: ['words', 'typo', 'proximity', 'attribute', 'sort', 'exactness'],
    });

    console.log('✅ Meilisearch index initialisé');
  } catch (err) {
    console.warn('⚠️ Meilisearch non disponible:', err.message);
  }
}

export default meili;
