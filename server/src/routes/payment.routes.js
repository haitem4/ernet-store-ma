// ============================================================
// ERNET STORE — Routes de paiement CMI
// ============================================================
import { Router } from 'express';
import { initiate, callback, paymentReturn } from '../controllers/payment.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.post('/initiate', protect, initiate);
router.post('/callback', callback); // IPN passerelle (sans auth)
router.post('/return', paymentReturn); // retour utilisateur

export default router;
