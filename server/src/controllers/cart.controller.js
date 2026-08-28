// ============================================================
// ERNET STORE — Contrôleur panier (PostgreSQL via Prisma)
// Stocké en base (fonctionne sans Redis). Support invité via sessionId.
// ============================================================
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { getPriceForUser } from '../services/pricing.service.js';

const addItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).default(1),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(0),
});

/**
 * Retrouve (ou crée) le panier pour un utilisateur ou une session invitée.
 */
async function findOrCreateCart(userId, sessionId) {
  // Panier connecté
  if (userId) {
    let cart = await prisma.cart.findUnique({ where: { userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId } });
    }
    return cart;
  }
  // Panier invité
  const sid = sessionId || 'guest';
  let cart = await prisma.cart.findFirst({ where: { sessionId: sid } });
  if (!cart) {
    cart = await prisma.cart.create({ data: { sessionId: sid } });
  }
  return cart;
}

/**
 * GET /api/cart
 */
export async function getCart(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || 'guest';

    const cart = await findOrCreateCart(userId, sessionId);
    const items = await prisma.cartItem.findMany({
      where: { cartId: cart.id },
      include: { product: { include: { brand: true } } },
    });

    // Enrichir avec le prix adapté au rôle
    const enriched = await Promise.all(
      items.map(async (item) => {
        const pricing = await getPriceForUser(item.product, req.user);
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: pricing.price,
          lineTotal: Number(pricing.price) * item.quantity,
          product: {
            id: item.product.id,
            name: item.product.name,
            slug: item.product.slug,
            images: item.product.images,
            price: pricing.price,
            brand: item.product.brand || null,
          },
        };
      })
    );

    const subtotal = enriched.reduce((sum, i) => sum + i.lineTotal, 0);
    return res.json({
      items: enriched,
      subtotal,
      count: enriched.reduce((s, i) => s + i.quantity, 0),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/items
 */
export async function addItem(req, res, next) {
  try {
    const { productId, quantity } = addItemSchema.parse(req.body);
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || 'guest';

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product)
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Produit introuvable' });

    const cart = await findOrCreateCart(userId, sessionId);

    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (existing) {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          quantity,
          price: product.price,
        },
      });
    }

    return res.status(201).json({ message: 'Produit ajouté au panier' });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/cart/items/:productId
 */
export async function updateItem(req, res, next) {
  try {
    const { productId } = req.params;
    const { quantity } = updateItemSchema.parse(req.body);
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || 'guest';

    const cart = await findOrCreateCart(userId, sessionId);
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    if (!existing)
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Article introuvable' });

    if (quantity === 0) {
      await prisma.cartItem.delete({ where: { id: existing.id } });
    } else {
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity },
      });
    }

    return res.json({ message: 'Panier mis à jour' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart/items/:productId
 */
export async function removeItem(req, res, next) {
  try {
    const { productId } = req.params;
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || 'guest';

    const cart = await findOrCreateCart(userId, sessionId);
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });
    if (existing) {
      await prisma.cartItem.delete({ where: { id: existing.id } });
    }

    return res.json({ message: 'Article retiré du panier' });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart
 */
export async function clearCart(req, res, next) {
  try {
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || 'guest';

    const cart = await findOrCreateCart(userId, sessionId);
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    return res.json({ message: 'Panier vidé' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/merge  (fusion panier invité → panier connecté)
 */
export async function mergeCart(req, res, next) {
  try {
    const guestId = req.headers['x-session-id'];
    if (!guestId || !req.user) return res.status(400).json({ code: 'BAD_REQUEST' });

    const guestCart = await prisma.cart.findFirst({ where: { sessionId: guestId } });
    const userCart = await findOrCreateCart(req.user.id, null);

    if (guestCart) {
      const guestItems = await prisma.cartItem.findMany({ where: { cartId: guestCart.id } });
      for (const gi of guestItems) {
        const existing = await prisma.cartItem.findUnique({
          where: { cartId_productId: { cartId: userCart.id, productId: gi.productId } },
        });
        if (existing) {
          await prisma.cartItem.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + gi.quantity },
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: userCart.id,
              productId: gi.productId,
              quantity: gi.quantity,
              price: gi.price,
            },
          });
        }
      }
      // Supprimer le panier invité
      await prisma.cartItem.deleteMany({ where: { cartId: guestCart.id } });
      await prisma.cart.delete({ where: { id: guestCart.id } });
    }

    return res.json({ message: 'Panier fusionné' });
  } catch (err) {
    next(err);
  }
}

export default { getCart, addItem, updateItem, removeItem, clearCart, mergeCart };
