// ============================================================
// ERNET STORE — Routes utilisateur
// ============================================================
import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// Toutes les routes utilisateur nécessitent une authentification
router.use(protect);

// Profil & Sécurité
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/password', updatePassword);

// Adresses
router.get('/addresses', getAddresses);
router.post('/addresses', addAddress);
router.put('/addresses/:id', updateAddress);
router.delete('/addresses/:id', deleteAddress);
router.post('/addresses/:id/default', setDefaultAddress);

// Favoris (Wishlist)
router.get('/wishlist', getWishlist);
router.post('/wishlist', addToWishlist);
router.delete('/wishlist/:productId', removeFromWishlist);

// Notifications
router.get('/notifications', getNotifications);
router.post('/notifications/:id/read', markNotificationRead);
router.post('/notifications/read-all', markAllNotificationsRead);

export default router;

