// ============================================================
// ERNET STORE — Service de tarification différenciée B2B/B2C
// ============================================================
import prisma from '../config/prisma.js';
import { cacheGet } from '../config/redis.js';

/**
 * Calcule le prix affiché pour un utilisateur selon son rôle.
 * - B2C : prix public
 * - B2B : prix avec remise selon sa grille (PriceTier)
 * @param {object} product - produit avec price / costPrice
 * @param {object} user - utilisateur (optionnel)
 */
export async function getPriceForUser(product, user) {
  // B2C ou non connecté → prix public
  if (!user || user.role === 'B2C') {
    return { price: product.price, isB2B: false };
  }

  // B2B → appliquer la remise de sa grille tarifaire
  const tier = await cacheGet(
    `pricing:tier:${user.id}`,
    async () => {
      return prisma.priceTier.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    },
    300
  );

  const discount = tier?.discount ? Number(tier.discount) : 0;
  const base = product.costPrice ?? product.price;
  const b2bPrice = Number(base) * (1 - discount / 100);

  return {
    price: b2bPrice,
    isB2B: true,
    discount,
    listPrice: product.price,
  };
}

/**
 * Enrichit une liste de produits avec un prix adapté à l'utilisateur.
 */
export async function enrichWithPricing(products, user) {
  return Promise.all(
    products.map(async (p) => {
      const pricing = await getPriceForUser(p, user);
      return { ...p, price: pricing.price, isB2B: pricing.isB2B };
    })
  );
}

export default { getPriceForUser, enrichWithPricing };
