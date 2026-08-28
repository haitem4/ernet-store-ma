// ============================================================
// ERNET STORE — Routes produits
// ============================================================
import { Router } from 'express';
import { list, getBySlug, related, featured, meta } from '../controllers/product.controller.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, list);
router.get('/meta', meta); // IMPORTANT : doit être déclaré avant /:slug
router.get('/featured', optionalAuth, featured);
router.get('/:slug', optionalAuth, getBySlug);
router.get('/:slug/related', related);

export default router;
