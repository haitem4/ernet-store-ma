// ============================================================
// ERNET STORE — Contrôleur admin (back-office)
// ============================================================
import prisma from '../config/prisma.js';
import { bulkImport, rebuildSearchIndex } from '../services/sync.service.js';
import { syncDiswayCatalog } from '../services/disway.service.js';
import { cacheDel } from '../config/redis.js';

/**
 * POST /api/admin/sync/import  — Import CSV/XML/JSON
 */
export async function importProducts(req, res, next) {
  try {
    const products = req.body.products;
    if (!Array.isArray(products)) {
      return res
        .status(400)
        .json({ code: 'BAD_REQUEST', message: 'products doit être un tableau' });
    }
    const result = await bulkImport(products);
    await rebuildSearchIndex();
    await cacheDel('products:*');
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/sync/rebuild — Reconstruit l'index de recherche
 */
export async function rebuildIndex(req, res, next) {
  try {
    const count = await rebuildSearchIndex();
    return res.json({ message: 'Index reconstruit', count });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/stats — Dashboard admin
 */
export async function stats(req, res, next) {
  try {
    const [products, orders, users, revenue] = await Promise.all([
      prisma.product.count(),
      prisma.order.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { total: true } }),
    ]);
    return res.json({
      products,
      orders,
      users,
      revenue: revenue._sum.total || 0,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/orders — Toutes les commandes
 */
export async function allOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      include: { user: { select: { id: true, email: true, companyName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/admin/orders/:id/status
 */
export async function updateOrderStatus(req, res, next) {
  try {
    const { status } = req.body;
    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: { status },
    });
    return res.json(order);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/admin/sync/disway — Import automatique des tarifs Disway
 * Lit le fichier Excel (URL ou local), applique la marge et synchronise.
 */
export async function syncDisway(req, res, next) {
  try {
    const result = await syncDiswayCatalog({
      clearExisting: req.body.clearExisting === true || req.query.clearExisting === 'true',
    });
    await rebuildSearchIndex();
    await cacheDel('products:*');
    return res.json(result);
  } catch (err) {
    next(err);
  }
}

export default { importProducts, rebuildIndex, stats, allOrders, updateOrderStatus, syncDisway };
