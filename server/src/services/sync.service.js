// ============================================================
// ERNET STORE — Service de synchronisation du catalogue
// Permet d'intégrer des produits depuis fournisseurs (API/CSV/XML/ERP)
// ============================================================
import prisma from '../config/prisma.js';
import meili, { PRODUCTS_INDEX } from '../config/meilisearch.js';
import { emitStockUpdate } from '../socket/index.js';
import { slugify } from '../utils/slug.js';

/**
 * Synchronise un produit dans la base + Meilisearch + notifie le stock.
 * @param {object} data
 */
export async function upsertProduct(data) {
  const {
    sku,
    name,
    slug,
    description,
    brandName,
    categoryName,
    price,
    compareAt,
    costPrice,
    stock,
    images,
    specs,
    supplier,
    supplierRef,
    isFeatured,
    isNew,
  } = data;

  // Résoudre ou créer la marque
  let brand = null;
  if (brandName) {
    brand = await prisma.brand.upsert({
      where: { slug: slugify(brandName) },
      update: { name: brandName },
      create: { name: brandName, slug: slugify(brandName) },
    });
  }

  // Résoudre ou créer la catégorie
  let category = null;
  if (categoryName) {
    category = await prisma.category.upsert({
      where: { slug: slugify(categoryName) },
      update: { name: categoryName },
      create: { name: categoryName, slug: slugify(categoryName) },
    });
  }

  // La résolution de conflit de slug est désormais gérée par l'appelant (ex: bulkImport)
  // pour les opérations en lot, afin d'éviter les requêtes N+1.
  const finalSlug = slug;

  const product = await prisma.product.upsert({
    where: { sku },
    update: {
      name,
      slug: finalSlug,
      description,
      price,
      compareAt,
      costPrice,
      stock,
      images,
      specs,
      supplier,
      supplierRef,
      isFeatured,
      isNew,
      brandId: brand?.id,
      categoryId: category?.id,
      lastSyncAt: new Date(),
    },
    create: {
      sku,
      name,
      slug: finalSlug,
      description,
      price,
      compareAt,
      costPrice,
      stock,
      images,
      specs,
      supplier,
      supplierRef,
      isFeatured,
      isNew,
      brandId: brand?.id,
      categoryId: category?.id,
      lastSyncAt: new Date(),
    },
  });

  // Indexer dans Meilisearch
  await indexProduct(product, brand, category);

  // Notifier le stock en temps réel
  emitStockUpdate({ productId: product.id, stock: product.stock });

  return product;
}

/**
 * Importe un lot de produits depuis un fichier CSV/XML ou une API.
 * Déduplique les slugs en cas de collision au sein du lot.
 * @param {object[]} products
 */
export async function clearProductCatalog() {
  await prisma.product.deleteMany({});
  try {
    await meili.index(PRODUCTS_INDEX).deleteAllDocuments();
  } catch (err) {
    console.warn('⚠️ Meilisearch suppression des documents échouée:', err.message);
  }
}

export async function bulkImport(products) {
  const results = { imported: 0, updated: 0, failed: 0 };
  if (!products || !products.length) return results;

  // 1. Déterminer les créations vs mises à jour en pré-chargeant les SKUs existants
  const incomingSkus = products.map((p) => p.sku);
  const existingProducts = await prisma.product.findMany({
    where: { sku: { in: incomingSkus } },
    select: { sku: true },
  });
  const existingSkuSet = new Set(existingProducts.map((p) => p.sku));

  // 2. Pré-charger tous les slugs de la base pour une résolution de conflit en mémoire (évite N+1 requêtes)
  const allDbProducts = await prisma.product.findMany({
    select: { slug: true, sku: true },
  });
  // Map<slug, sku> pour vérifier les propriétaires des slugs
  const allDbSlugs = new Map(allDbProducts.filter((p) => p.slug).map((p) => [p.slug, p.sku]));

  // 3. Traiter les produits en série pour résoudre les conflits de slug avant l'import
  for (const p of products) {
    try {
      const data = { ...p };
      let finalSlug = data.slug;

      // Générer un slug unique si un conflit est détecté
      if (finalSlug) {
        const slugOwnerSku = allDbSlugs.get(finalSlug);
        // Conflit si le slug existe et appartient à un autre produit que celui en cours
        if (slugOwnerSku && slugOwnerSku !== data.sku) {
          let n = 2;
          let candidate;
          do {
            candidate = `${data.slug}-${n}`;
            n++;
          } while (allDbSlugs.has(candidate)); // Cherche un suffixe non utilisé
          finalSlug = candidate;
        }
      }
      data.slug = finalSlug;

      // L'upsert est maintenant plus simple et plus rapide
      await upsertProduct(data);

      // Mettre à jour le compteur et l'état des slugs pour le prochain produit du lot
      if (finalSlug) {
        allDbSlugs.set(finalSlug, data.sku); // Ajoute/met à jour le slug dans notre map en mémoire
      }
      if (existingSkuSet.has(data.sku)) {
        results.updated++;
      } else {
        results.imported++;
      }
    } catch (err) {
      console.error(`❌ Échec import ${p.sku}:`, err.message);
      results.failed++;
    }
  }
  return results;
}

/**
 * Indexe un produit dans Meilisearch.
 */
async function indexProduct(product, brand, category) {
  try {
    await meili.index(PRODUCTS_INDEX).addDocuments([
      {
        id: product.id,
        sku: product.sku,
        name: product.name,
        slug: product.slug,
        description: product.description,
        brand: brand?.name || null,
        category: category?.name || null,
        price: Number(product.price),
        stock: product.stock,
        status: product.status,
        images: product.images,
        createdAt: product.createdAt,
      },
    ]);
  } catch (err) {
    console.warn('⚠️ Meilisearch indexation:', err.message);
  }
}

/**
 * Reconstruit entièrement l'index Meilisearch depuis la base.
 */
export async function rebuildSearchIndex() {
  const products = await prisma.product.findMany({
    include: { brand: true, category: true },
  });
  const docs = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand?.name || null,
    category: p.category?.name || null,
    price: Number(p.price),
    stock: p.stock,
    status: p.status,
    images: p.images,
    createdAt: p.createdAt,
  }));
  try {
    const index = meili.index(PRODUCTS_INDEX);
    await index.deleteAllDocuments();
    if (docs.length) await index.addDocuments(docs);
  } catch (err) {
    console.warn('⚠️ Meilisearch reconstruction échouée:', err.message);
    return 0;
  }
  return docs.length;
}

export default { upsertProduct, bulkImport, rebuildSearchIndex };
