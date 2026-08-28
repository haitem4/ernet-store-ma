// ============================================================
// ERNET STORE — Routes panier
// ============================================================
import { Router } from 'express';
import {
  getCart,
  addItem,
  updateItem,
  removeItem,
  clearCart,
  mergeCart,
} from '../controllers/cart.controller.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = Router();

// Le panier est accessible sans connexion (invité via x-session-id).
router.get('/', optionalAuth, getCart);
router.post('/items', optionalAuth, addItem);
router.patch('/items/:productId', optionalAuth, updateItem);
router.put('/items/:productId', optionalAuth, updateItem);
router.delete('/items/:productId', optionalAuth, removeItem);
router.delete('/', optionalAuth, clearCart);
router.post('/merge', protect, mergeCart);

export default router;
