// ============================================================
// ERNET STORE — Contrôleur commandes + devis
// ============================================================
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { generateOrderNumber, generateQuoteNumber } from '../utils/auth.js';
import { getPriceForUser } from '../services/pricing.service.js';
import { emitOrderUpdate, notifyUser } from '../socket/index.js';

const createOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  shippingMethod: z.string().default('delivery'),
  shippingAddress: z.string().optional(),
  paymentMethod: z.enum(['CMI', 'BANK_TRANSFER', 'COD']),
  notes: z.string().optional(),
});

/**
 * POST /api/orders
 * Crée une commande, calcule les prix selon le rôle (B2B/B2C), décrémente le stock.
 */
export async function createOrder(req, res, next) {
  try {
    const data = createOrderSchema.parse(req.body);
    const userId = req.user.id;

    // Calcul du sous-total avec le prix adapté à l'utilisateur
    let subtotal = 0;
    const orderItems = [];
    for (const item of data.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw Object.assign(new Error('Produit introuvable'), { status: 404 });
      if (product.stock < item.quantity) {
        throw Object.assign(new Error(`Stock insuffisant pour ${product.name}`), { status: 409 });
      }
      const pricing = await getPriceForUser(product, req.user);
      const unitPrice = Number(pricing.price);
      const lineTotal = unitPrice * item.quantity;
      subtotal += lineTotal;
      orderItems.push({
        productId: product.id,
        name: product.name,
        quantity: item.quantity,
        price: unitPrice,
        total: lineTotal,
      });
    }

    // Frais de livraison simples (gratuite au-delà de 2000 DH)
    const shipping = subtotal >= 2000 ? 0 : 50;
    const tax = 0;
    const total = subtotal + shipping + tax;

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: 'PENDING',
          paymentStatus: 'UNPAID',
          paymentMethod: data.paymentMethod,
          subtotal,
          shipping,
          tax,
          total,
          shippingMethod: data.shippingMethod,
          shippingAddress: data.shippingAddress,
          notes: data.notes,
          items: {
            create: orderItems,
          },
        },
        include: { items: true },
      });

      // Décrémenter le stock
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return created;
    });

    // Notifications temps réel
    notifyUser(userId, { type: 'ORDER_CREATED', message: `Commande ${order.orderNumber} créée` });
    emitOrderUpdate(userId, order);

    return res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders  (mes commandes)
 */
export async function myOrders(req, res, next) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 */
export async function getOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: { include: { product: true } } },
    });
    if (!order) return res.status(404).json({ code: 'NOT_FOUND', message: 'Commande introuvable' });
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Accès refusé' });
    }
    return res.json(order);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/orders/quotes  (demande de devis B2B)
 * Le modèle Quote stocke `items` en JSON.
 */
export async function createQuote(req, res, next) {
  try {
    const data = z
      .object({
        items: z
          .array(z.object({ productId: z.string(), quantity: z.number().int().min(1) }))
          .min(1),
        message: z.string().optional(),
      })
      .parse(req.body);

    // Résoudre les produits pour stocker les infos dans le JSON
    const resolvedItems = [];
    for (const item of data.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, price: true, sku: true },
      });
      if (product) {
        resolvedItems.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          price: Number(product.price),
          quantity: item.quantity,
        });
      }
    }

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        userId: req.user.id,
        status: 'PENDING',
        message: data.message,
        items: resolvedItems, // stocké en JSON
      },
    });

    notifyUser(req.user.id, {
      type: 'QUOTE_CREATED',
      message: `Devis ${quote.quoteNumber} envoyé`,
    });
    return res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/quotes  (mes devis)
 */
export async function myQuotes(req, res, next) {
  try {
    const quotes = await prisma.quote.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(quotes);
  } catch (err) {
    next(err);
  }
}

export default { createOrder, myOrders, getOrder, createQuote, myQuotes };
