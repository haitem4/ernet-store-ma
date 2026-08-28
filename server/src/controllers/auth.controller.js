// ============================================================
// ERNET STORE — Contrôleur d'authentification
// ============================================================
import { z } from 'zod';
import prisma from '../config/prisma.js';
import {
  clearAuthCookie,
  hashPassword,
  setAuthCookie,
  signToken,
  verifyPassword,
} from '../utils/auth.js';

const registerSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe min 8 caractères'),
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  companyReg: z.string().optional(),
  role: z.enum(['B2C', 'B2B']).default('B2C'),
});

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
});

/**
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (existing) {
      return res.status(409).json({ code: 'EMAIL_EXISTS', message: 'Cet email est déjà utilisé' });
    }

    const password = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        companyName: data.companyName,
        companyReg: data.companyReg,
        role: data.role,
        status: data.role === 'B2B' ? 'PENDING' : 'ACTIVE',
      },
    });

    const token = signToken(user.id, user.role);
    setAuthCookie(res, token);
    return res.status(201).json({
      token,
      user: sanitize(user),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email.toLowerCase() } });
    if (!user) {
      return res
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' });
    }

    const valid = await verifyPassword(data.password, user.password);
    if (!valid) {
      return res
        .status(401)
        .json({ code: 'INVALID_CREDENTIALS', message: 'Email ou mot de passe incorrect' });
    }

    if (user.status !== 'ACTIVE' && user.role !== 'ADMIN') {
      return res.status(403).json({
        code: 'ACCOUNT_PENDING',
        message: 'Compte en attente de validation par notre équipe',
      });
    }

    const token = signToken(user.id, user.role);
    setAuthCookie(res, token);
    return res.json({ token, user: sanitize(user) });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
export async function logout(_req, res, next) {
  try {
    clearAuthCookie(res);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
export async function me(req, res, next) {
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
      },
    });
    return res.json({ user });
  } catch (err) {
    next(err);
  }
}

function sanitize(user) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    companyName: user.companyName,
  };
}

export default { register, login, logout, me };
