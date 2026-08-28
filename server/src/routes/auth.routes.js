// ============================================================
// ERNET STORE — Routes authentification
// ============================================================
import { Router } from 'express';
import { login, logout, me, register } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.js';
import { authLimiter, registerLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.post('/register', registerLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', protect, me);

export default router;
