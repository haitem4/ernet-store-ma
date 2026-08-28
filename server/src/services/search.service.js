// ============================================================
// ERNET STORE — Service de recherche
// Utilise Meilisearch si disponible, sinon bascule sur Prisma (PostgreSQL).
// ============================================================
import meili, { PRODUCTS_INDEX } from '../config/meilisearch.js';
import prisma from '../config/prisma.js';

/**
 * Recherche produits avec filtres multicritères.
 * @param {object} params
 * @param {string} params.q - requête texte
 * @param {string[]} params.brand - marque(s)
 * @param {string[]} params.category - catégorie(s)
 * @param {number} params.minPrice
 * @param {number} params.maxPrice
 * @param {string} params.stock - "in" | "out"
 * @param {string} params.sort - "price_asc" | "price_desc" | "newest"
 * @param {number} params.page
 * @param {number} params.perPage
 */
export async function searchProducts({
  q = '',
  brand,
  category,
  minPrice,
  maxPrice,
  stock,
  sort,
  page = 1,
  perPage = 24,
} = {}) {
  // 1) Tentative Meilisearch
  try {
    const filters = [];

    if (brand) {
      const brands = brand
        .split(',')
        .map((b) => `"${b}"`)
        .join(', ');
      filters.push(`brand IN [${brands}]`);
    }
    if (category) {
      const cats = category
        .split(',')
        .map((c) => `"${c}"`)
        .join(', ');
      filters.push(`category IN [${cats}]`);
    }
    if (minPrice !== undefined && minPrice !== '') filters.push(`price >= ${minPrice}`);
    if (maxPrice !== undefined && maxPrice !== '') filters.push(`price <= ${maxPrice}`);
    if (stock === 'in') filters.push('stock > 0');
    if (stock === 'out') filters.push('stock <= 0');

    let sortBy = [];
    if (sort === 'price_asc') sortBy = ['price:asc'];
    if (sort === 'price_desc') sortBy = ['price:desc'];
    if (sort === 'newest') sortBy = ['createdAt:desc'];

    const index = meili.index(PRODUCTS_INDEX);
    const result = await index.search(q, {
      filter: filters.length ? filters.join(' AND ') : undefined,
      sort: sortBy.length ? sortBy : undefined,
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    return {
      hits: result.hits,
      total: result.estimatedTotalHits,
      page,
      perPage,
      totalPages: Math.ceil(result.estimatedTotalHits / perPage),
      engine: 'meilisearch',
    };
  } catch (err) {
    console.warn('⚠️ Meilisearch indisponible, bascule sur Prisma:', err.message);
  }

  // 2) Fallback Prisma (PostgreSQL)
  const where = { status: 'ACTIVE' };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { sku: { contains: q, mode: 'insensitive' } },
    ];
  }
  if (brand) {
    const brandNames = brand.split(',').map((v) => v.trim()).filter(Boolean);
    where.brand = {
      OR: [{ name: { in: brandNames } }, { slug: { in: brandNames } }],
    };
  }
  if (category) {
    const catNames = category.split(',').map((v) => v.trim()).filter(Boolean);
    where.category = {
      OR: [{ name: { in: catNames } }, { slug: { in: catNames } }],
    };
  }
  if (minPrice !== undefined && minPrice !== '') {
    where.price = { ...(where.price || {}), gte: Number(minPrice) };
  }
  if (maxPrice !== undefined && maxPrice !== '') {
    where.price = { ...(where.price || {}), lte: Number(maxPrice) };
  }
  if (stock === 'in') where.stock = { gt: 0 };
  if (stock === 'out') where.stock = { lte: 0 };

  const orderBy = [];
  if (sort === 'price_asc') orderBy.push({ price: 'asc' });
  if (sort === 'price_desc') orderBy.push({ price: 'desc' });
  if (sort === 'newest') orderBy.push({ createdAt: 'desc' });
  orderBy.push({ createdAt: 'desc' });

  const total = await prisma.product.count({ where });
  const products = await prisma.product.findMany({
    where,
    orderBy,
    skip: (page - 1) * perPage,
    take: perPage,
    include: { brand: true, category: true },
  });

  const hits = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    slug: p.slug,
    description: p.description,
    brand: p.brand?.name || null,
    category: p.category?.name || null,
    price: Number(p.price),
    compareAt: p.compareAt ? Number(p.compareAt) : null,
    stock: p.stock,
    status: p.status,
    images: p.images,
    createdAt: p.createdAt,
  }));

  return {
    hits,
    total,
    page,
    perPage,
    totalPages: Math.ceil(total / perPage),
    engine: 'prisma',
  };
}

/**
 * Suggestions de recherche (autocomplete).
 */
export async function suggest(q) {
  if (!q) return [];

  // Tentative Meilisearch
  try {
    const result = await meili.index(PRODUCTS_INDEX).search(q, {
      limit: 8,
      attributesToRetrieve: ['id', 'name', 'brand', 'price', 'slug', 'images'],
    });
    return result.hits;
  } catch (err) {
    console.warn('⚠️ Meilisearch indisponible pour suggestions:', err.message);
  }

  // Fallback Prisma
  const products = await prisma.product.findMany({
    where: {
      status: 'ACTIVE',
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { name: { contains: q, mode: 'insensitive' } } },
      ],
    },
    take: 8,
    include: { brand: true },
  });

  return products.map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand?.name || null,
    price: Number(p.price),
    slug: p.slug,
    images: p.images,
  }));
}

export default { searchProducts, suggest };
