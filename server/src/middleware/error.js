// ============================================================
// ERNET STORE — Gestion centralisée des erreurs
// ============================================================

/**
 * Route non trouvée (404).
 */
export function notFound(req, res) {
  res
    .status(404)
    .json({ code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} introuvable` });
}

/**
 * Gestionnaire d'erreurs global.
 */
export function errorHandler(err, req, res, _next) {
  console.error('❌ Erreur:', err);

  // Erreurs Prisma
  if (err.code === 'P2002') {
    return res
      .status(409)
      .json({ code: 'DUPLICATE', message: 'Un enregistrement avec cet identifiant existe déjà' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ code: 'NOT_FOUND', message: 'Enregistrement introuvable' });
  }

  // Erreurs Zod (validation)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      code: 'VALIDATION_ERROR',
      message: 'Données invalides',
      errors: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  const status = err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  res.status(status).json({
    code: err.code || 'INTERNAL_ERROR',
    message:
      status >= 500 && isProd ? 'Erreur interne du serveur' : err.message || 'Erreur interne du serveur',
  });
}

export default { notFound, errorHandler };
