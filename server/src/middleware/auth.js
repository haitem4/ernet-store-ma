// ============================================================
// ERNET STORE — Middleware d'authentification JWT
// ============================================================
import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import prisma from '../config/prisma.js';

function getCookie(req, name) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;
  const cookies = cookieHeader.split(';').map((part) => part.trim());
  const prefix = `${name}=`;
  const cookie = cookies.find((part) => part.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

/**
 * Protège une route : vérifie le JWT et charge l'utilisateur.
 */
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = bearerToken || getCookie(req, env.jwtCookieName);
    if (!token) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentification requise' });
    }

    const payload = jwt.verify(token, env.jwtSecret);

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
    });

    if (!user)
      return res.status(401).json({ code: 'USER_NOT_FOUND', message: 'Utilisateur introuvable' });
    if (user.status !== 'ACTIVE' && user.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ code: 'ACCOUNT_PENDING', message: 'Compte en attente de validation' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ code: 'INVALID_TOKEN', message: 'Token invalide ou expiré' });
  }
}

/**
 * Auth optionnelle : charge l'utilisateur si un JWT est présent, sinon continue.
 */
export async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    const token = bearerToken || getCookie(req, env.jwtCookieName);
    if (!token) return next();

    const payload = jwt.verify(token, env.jwtSecret);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        firstName: true,
        lastName: true,
        companyName: true,
      },
    });
    if (user && (user.status === 'ACTIVE' || user.role === 'ADMIN')) {
      req.user = user;
    }
  } catch {
    // Token absent ou invalide : on reste anonyme
  }
  next();
}

/**
 * Restreint l'accès à certains rôles.
 * @param  {...import('@prisma/client').UserRole} roles
 */
export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Non authentifié' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Accès refusé' });
    }
    next();
  };
}

export default { protect, optionalAuth, authorize };
