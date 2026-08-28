// ============================================================
// ERNET STORE — Contrôleur de paiement CMI
// Initie un paiement, traite le callback et le retour de la passerelle.
// ============================================================
import { z } from 'zod';
import prisma from '../config/prisma.js';
import env from '../config/env.js';
import { createPayment, generateHash } from '../services/cmi.service.js';
import { notifyUser } from '../socket/index.js';

const initiateSchema = z.object({
  orderId: z.string(),
});

/**
 * POST /api/payment/initiate
 * Génère les paramètres de paiement CMI pour une commande appartenant à l'utilisateur.
 */
export async function initiate(req, res, next) {
  try {
    const { orderId } = initiateSchema.parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });
    if (!order) return res.status(404).json({ code: 'NOT_FOUND', message: 'Commande introuvable' });
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Accès refusé' });
    }

    const clientUrl = env.clientUrl.split(',')[0].trim();
    const successUrl = `${clientUrl}/compte/orders/${order.id}?pay=success`;
    const failUrl = `${clientUrl}/compte/orders/${order.id}?pay=failed`;

    const payment = createPayment({
      orderId: order.orderNumber,
      amount: Number(order.total),
      clientId: order.userId,
      email: order.user.email,
      successUrl,
      failUrl,
      callbackUrl: `${env.apiUrl}/api/payment/callback`,
    });

    return res.json({ gatewayUrl: payment.gatewayUrl, params: payment.params });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payment/callback
 * Notification serveur (IPN) de la passerelle CMI.
 * Vérifie le hash puis met à jour le statut de paiement de la commande.
 */
export async function callback(req, res, next) {
  try {
    const { oid, hash, response, mdstatus, clientid } = req.body;

    if (!hash && env.nodeEnv === 'production') {
      return res.status(400).json({ code: 'MISSING_HASH', message: 'Signature CMI manquante' });
    }

    // Vérifier la signature CMI dès qu'elle est fournie, obligatoire en production.
    if (hash) {
      const expected = generateHash({
        clientid: clientid || env.cmiMerchantId,
        oid,
        amount: req.body.amount,
        okurl: req.body.okurl || '',
        failurl: req.body.failurl || '',
        callbackurl: req.body.callbackurl || '',
        rnd: req.body.rnd,
      });
      if (expected !== hash) {
        return res.status(400).json({ code: 'INVALID_HASH', message: 'Signature invalide' });
      }
    }

    // Mettre à jour la commande correspondante
    const order = await prisma.order.findFirst({ where: { orderNumber: oid } });
    if (order) {
      const paid = response === 'Approved' || String(mdstatus) === '1' || String(mdstatus) === '2';
      await prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: paid ? 'PAID' : 'FAILED',
          status: paid ? 'CONFIRMED' : order.status,
        },
      });
      notifyUser(order.userId, {
        type: paid ? 'PAYMENT_SUCCESS' : 'PAYMENT_FAILED',
        message: paid
          ? `Paiement confirmé pour ${order.orderNumber}`
          : `Échec du paiement ${order.orderNumber}`,
      });
    }

    return res.json({ message: 'OK' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payment/return
 * Retour utilisateur depuis la passerelle (après paiement).
 */
export async function paymentReturn(req, res, next) {
  try {
    const { oid, response } = req.body;
    const clientUrl = env.clientUrl.split(',')[0].trim();
    if (response === 'Approved') {
      return res.redirect(`${clientUrl}/compte/orders/${oid}?pay=success`);
    }
    return res.redirect(`${clientUrl}/compte/orders/${oid}?pay=failed`);
  } catch (err) {
    next(err);
  }
}

export default { initiate, callback, paymentReturn };
