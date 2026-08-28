// ============================================================
// ERNET STORE — Routes commandes & devis
// ============================================================
import { Router } from 'express';
import {
  createOrder,
  myOrders,
  getOrder,
  createQuote,
  myQuotes,
} from '../controllers/order.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get('/', myOrders);
router.post('/', createOrder);
router.get('/quotes', myQuotes);
router.post('/quotes', createQuote);
router.get('/:id', getOrder);

export default router;
