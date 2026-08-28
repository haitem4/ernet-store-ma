// ============================================================
// ERNET STORE — Contrôleur produits
// ============================================================
import prisma from '../config/prisma.js';
import { cacheGet } from '../config/redis.js';
import { searchProducts } from '../services/search.service.js';
import { getPriceForUser } from '../services/pricing.service.js';

/**
 * GET /api/products?q=&brand=&category=&minPrice=&maxPrice=&stock=&sort=&page=&perPage=
 * Recherche rapide via Meilisearch.
 */
export async function list(req, res, next) {
  try {
    // Page d'accueil : /api/products?featured=true&limit=8
    if (req.query.featured === 'true') {
      const products = await prisma.product.findMany({
        where: { isFeatured: true, status: 'ACTIVE' },
        take: Number(req.query.limit) || 8,
        include: { brand: true, category: true },
      });
      const user = req.user || null;
      const enriched = await Promise.all(
        products.map(async (p) => {
          const pricing = await getPriceForUser(p, user);
          return { ...p, price: pricing.price, isB2B: pricing.isB2B };
        })
      );
      return res.json({ hits: enriched, total: enriched.length, featured: true });
    }

    // Page promotions : /api/products?onSale=true&limit=12
    if (req.query.onSale === 'true') {
      const products = await prisma.product.findMany({
        where: { status: 'ACTIVE', compareAt: { not: null } },
        take: Number(req.query.limit) || 12,
        include: { brand: true, category: true },
      });
      const user = req.user || null;
      const enriched = await Promise.all(
        products.map(async (p) => {
          const pricing = await getPriceForUser(p, user);
          return { ...p, price: pricing.price, isB2B: pricing.isB2B };
        })
      );
      return res.json({ hits: enriched, total: enriched.length, onSale: true });
    }

    // Le frontend envoie `inStock=true` ; on le traduit en `stock=in`.
    const stockParam = req.query.stock || (req.query.inStock === 'true' ? 'in' : undefined);

    const toNumber = (value) => {
      if (value === undefined || value === null || value === '') return undefined;
      const n = Number(value);
      return Number.isFinite(n) ? n : undefined;
    };

    let brandFilter = req.query.brand || undefined;
    let categoryFilter = req.query.category || undefined;

    if (brandFilter) {
      const brand = await prisma.brand.findFirst({
        where: { OR: [{ slug: brandFilter }, { name: { equals: brandFilter, mode: 'insensitive' } }] },
        select: { name: true, slug: true },
      });
      if (brand) brandFilter = brand.name;
    }
    if (categoryFilter) {
      const category = await prisma.category.findFirst({
        where: {
          OR: [{ slug: categoryFilter }, { name: { equals: categoryFilter, mode: 'insensitive' } }],
        },
        select: { name: true, slug: true },
      });
      if (category) categoryFilter = category.name;
    }

    const result = await searchProducts({
      q: req.query.q,
      brand: brandFilter,
      category: categoryFilter,
      minPrice: toNumber(req.query.minPrice),
      maxPrice: toNumber(req.query.maxPrice),
      stock: stockParam,
      sort: req.query.sort,
      page: Number(req.query.page) || 1,
      perPage: toNumber(req.query.perPage) || toNumber(req.query.limit) || 24,
    });

    // Enrichir avec le prix adapté (B2B/B2C)
    const user = req.user || null;
    const enriched = await Promise.all(
      result.hits.map(async (p) => {
        const pricing = await getPriceForUser(
          { id: p.id, price: p.price, costPrice: p.price },
          user
        );
        return { ...p, price: pricing.price, isB2B: pricing.isB2B };
      })
    );

    return res.json({ ...result, hits: enriched });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:slug
 */
export async function getBySlug(req, res, next) {
  try {
    const product = await cacheGet(
      `product:${req.params.slug}`,
      async () =>
        prisma.product.findUnique({
          where: { slug: req.params.slug },
          include: { brand: true, category: true },
        }),
      60
    );

    if (!product) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Produit introuvable' });
    }

    const pricing = await getPriceForUser(product, req.user);
    return res.json({ ...product, price: pricing.price, isB2B: pricing.isB2B });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:slug/related
 */
export async function related(req, res, next) {
  try {
    const product = await prisma.product.findUnique({ where: { slug: req.params.slug } });
    if (!product)
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Produit introuvable' });

    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        NOT: { id: product.id },
      },
      take: 4,
      include: { brand: true },
    });

    return res.json(related);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/meta
 * Retourne les vraies catégories et marques (avec compte produits) pour
 * alimenter dynamiquement les filtres du catalogue.
 */
export async function meta(req, res, next) {
  try {
    const [categories, brands] = await Promise.all([
      prisma.category.findMany({
        where: { products: { some: { status: 'ACTIVE' } } },
        select: { name: true, slug: true, _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      }),
      prisma.brand.findMany({
        where: { products: { some: { status: 'ACTIVE' } } },
        select: { name: true, slug: true, _count: { select: { products: true } } },
        orderBy: { name: 'asc' },
      }),
    ]);
    return res.json({
      categories: categories.map((c) => ({ name: c.name, slug: c.slug, count: c._count.products })),
      brands: brands.map((b) => ({ name: b.name, slug: b.slug, count: b._count.products })),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/featured
 */
export async function featured(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isFeatured: true, status: 'ACTIVE' },
      take: 8,
      include: { brand: true, category: true },
    });
    const user = req.user || null;
    const enriched = await Promise.all(
      products.map(async (p) => {
        const pricing = await getPriceForUser(p, user);
        return { ...p, price: pricing.price, isB2B: pricing.isB2B };
      })
    );
    return res.json(enriched);
  } catch (err) {
    next(err);
  }
}

export default { list, getBySlug, related, featured, meta };
