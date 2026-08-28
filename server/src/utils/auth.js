// ============================================================
// ERNET STORE — Utilitaires authentification (JWT, hash)
// ============================================================
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';

/**
 * Hash un mot de passe.
 */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

/**
 * Compare un mot de passe en clair avec un hash.
 */
export async function verifyPassword(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

/**
 * Génère un JWT.
 * @param {string} userId
 * @param {string} role
 */
export function signToken(userId, role) {
  return jwt.sign({ sub: userId, role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export function setAuthCookie(res, token) {
  res.cookie(env.jwtCookieName, token, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.jwtCookieName, {
    httpOnly: true,
    secure: env.nodeEnv === 'production',
    sameSite: env.nodeEnv === 'production' ? 'none' : 'lax',
    path: '/',
  });
}

/**
 * Génère un numéro de commande unique.
 */
export function generateOrderNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `CMD-${y}${m}-${rand}`;
}

/**
 * Génère un numéro de devis unique.
 */
export function generateQuoteNumber() {
  const date = new Date();
  const y = date.getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `DEV-${y}-${rand}`;
}

export default {
  hashPassword,
  verifyPassword,
  signToken,
  setAuthCookie,
  clearAuthCookie,
  generateOrderNumber,
  generateQuoteNumber,
};
