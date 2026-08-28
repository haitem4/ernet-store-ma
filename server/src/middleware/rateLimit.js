// ============================================================
// ERNET STORE — Rate limiting (anti brute force / DDoS)
// ============================================================
import rateLimit from 'express-rate-limit';

// Limite générale de l'API : 300 requêtes / 15 min / IP
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Trop de requêtes. Veuillez réessayer plus tard.',
  },
});

// Limite stricte sur l'authentification (anti brute force) : 10 tentatives / 15 min
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // ne compte pas les connexions réussies
  message: {
    code: 'TOO_MANY_ATTEMPTS',
    message:
      'Trop de tentatives de connexion. Compte temporairement bloqué, réessayez dans 15 minutes.',
  },
});

// Limite sur la création de compte : 5 inscriptions / heure / IP
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'TOO_MANY_REGISTRATIONS',
    message: "Trop d'inscriptions depuis cette adresse. Réessayez plus tard.",
  },
});

// Limite sur l'import disway (action lourde) : 5 / heure / IP
export const heavyTaskLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    code: 'TOO_MANY_REQUESTS',
    message: 'Opération trop fréquente. Réessayez plus tard.',
  },
});

export default { apiLimiter, authLimiter, registerLimiter, heavyTaskLimiter };
