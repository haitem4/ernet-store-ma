// ============================================================
// ERNET STORE — Contrôleur utilisateur (profil, adresses, favoris, notifications)
// ============================================================
import { z } from 'zod';
import prisma from '../config/prisma.js';
import { hashPassword, verifyPassword } from '../utils/auth.js';

const updateProfileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  companyReg: z.string().nullable().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
});

const addressSchema = z.object({
  label: z.string().min(1, 'Libellé requis (ex: Bureau, Domicile)'),
  city: z.string().min(1, 'Ville requise'),
  address: z.string().min(1, 'Adresse requise'),
  postal: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isDefault: z.boolean().optional().default(false),
});

// ---------- PROFIL ----------

export async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        companyReg: true,
        role: true,
        status: true,
        createdAt: true,
        priceTier: true,
      },
    });

    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' });
    }

    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = updateProfileSchema.parse(req.body);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        companyName: true,
        companyReg: true,
        role: true,
        status: true,
      },
    });

    return res.json({ user, message: 'Profil mis à jour avec succès' });
  } catch (err) {
    next(err);
  }
}

export async function updatePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = updatePasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Utilisateur introuvable' });
    }

    const isValid = await verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({
        code: 'INVALID_PASSWORD',
        message: 'Le mot de passe actuel est incorrect',
      });
    }

    const hashedPassword = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    return res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (err) {
    next(err);
  }
}

// ---------- ADRESSES ----------

export async function getAddresses(req, res, next) {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
    return res.json(addresses);
  } catch (err) {
    next(err);
  }
}

export async function addAddress(req, res, next) {
  try {
    const data = addressSchema.parse(req.body);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const count = await prisma.address.count({ where: { userId: req.user.id } });
    const isFirst = count === 0;

    const address = await prisma.address.create({
      data: {
        ...data,
        isDefault: isFirst ? true : data.isDefault,
        userId: req.user.id,
      },
    });

    return res.status(201).json(address);
  } catch (err) {
    next(err);
  }
}

export async function updateAddress(req, res, next) {
  try {
    const { id } = req.params;
    const data = addressSchema.partial().parse(req.body);

    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Adresse introuvable' });
    }

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id },
      data,
    });

    return res.json(address);
  } catch (err) {
    next(err);
  }
}

export async function deleteAddress(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Adresse introuvable' });
    }

    await prisma.address.delete({ where: { id } });
    return res.json({ message: 'Adresse supprimée' });
  } catch (err) {
    next(err);
  }
}

export async function setDefaultAddress(req, res, next) {
  try {
    const { id } = req.params;
    const existing = await prisma.address.findUnique({ where: { id } });
    if (!existing || existing.userId !== req.user.id) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Adresse introuvable' });
    }

    await prisma.address.updateMany({
      where: { userId: req.user.id },
      data: { isDefault: false },
    });

    const updated = await prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });

    return res.json(updated);
  } catch (err) {
    next(err);
  }
}

// ---------- FAVORIS (WISHLIST) ----------

export async function getWishlist(req, res, next) {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: { brand: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ code: 'BAD_REQUEST', message: 'productId requis' });
    }

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Produit introuvable' });
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId,
        },
      },
      update: {},
      create: {
        userId: req.user.id,
        productId,
      },
      include: { product: true },
    });

    return res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const { productId } = req.params;

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: req.user.id,
        productId,
      },
    });

    return res.json({ message: 'Produit retiré des favoris' });
  } catch (err) {
    next(err);
  }
}

// ---------- NOTIFICATIONS ----------

export async function getNotifications(req, res, next) {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return res.json(notifications);
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.notification.updateMany({
      where: { id, userId: req.user.id },
      data: { read: true },
    });
    return res.json({ message: 'Notification marquée comme lue' });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data: { read: true },
    });
    return res.json({ message: 'Toutes les notifications sont marquées comme lues' });
  } catch (err) {
    next(err);
  }
}

export default {
  getProfile,
  updateProfile,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};

