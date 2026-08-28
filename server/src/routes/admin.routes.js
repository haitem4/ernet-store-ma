// ============================================================
// ERNET STORE — Routes admin (back-office)
// ============================================================
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  importProducts,
  rebuildIndex,
  stats,
  allOrders,
  updateOrderStatus,
  syncDisway,
} from '../controllers/admin.controller.js';
import { syncDiswayCatalog } from '../services/disway.service.js';
import { protect, authorize } from '../middleware/auth.js';
import { heavyTaskLimiter } from '../middleware/rateLimit.js';

const router = Router();
const UPLOADS_DIR = 'uploads/';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'application/octet-stream',
    ];
    if (allowedTypes.includes(file.mimetype) || /\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) et CSV sont autorisés.'), false);
    }
  },
});

router.use(protect, authorize('ADMIN'));

router.get('/stats', stats);
router.get('/orders', allOrders);
router.patch('/orders/:id/status', updateOrderStatus);
router.post('/sync/import', heavyTaskLimiter, importProducts);
router.post(
  '/sync/upload',
  heavyTaskLimiter,
  upload.single('catalogFile'),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }
    try {
      const result = await syncDiswayCatalog({ localOnly: true });
      return res.json({ ...result, message: `Fichier '${req.file.originalname}' traité.` });
    } catch (error) {
      next(error);
    }
  }
);
router.post('/sync/rebuild', heavyTaskLimiter, rebuildIndex);
router.post('/sync/disway', heavyTaskLimiter, syncDisway);

export default router;
