// ============================================================
// ERNET STORE — Routes d'administration pour la synchronisation
// ============================================================
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { syncDiswayCatalog } from '../services/disway.service.js';
import { protect, authorize } from '../middleware/auth.js'; // Assurez-vous que le chemin est correct
import { heavyTaskLimiter } from '../middleware/rateLimit.js'; // Rate limiter pour les tâches lourdes

const router = Router();
const UPLOADS_DIR = 'uploads/';

// S'assurer que le dossier d'upload existe
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configurer Multer pour le stockage des fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Nom de fichier unique pour éviter les conflits
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accepter uniquement les fichiers Excel
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers Excel (.xlsx, .xls) et CSV sont autorisés.'), false);
    }
  },
});

/**
 * POST /api/admin/sync/upload
 * Route sécurisée pour uploader un fichier catalogue et lancer la synchronisation.
 * Accessible uniquement aux administrateurs.
 */
router.post(
  '/upload',
  protect,
  authorize('ADMIN'),
  heavyTaskLimiter,
  upload.single('catalogFile'), // 'catalogFile' est le nom du champ du formulaire
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier fourni.' });
    }
    try {
      // Le fichier est dans `uploads/`. On lance la synchro en mode "localOnly"
      // pour qu'elle utilise ce fichier au lieu de le télécharger.
      const result = await syncDiswayCatalog({ localOnly: true });
      res.json({ ...result, message: `Fichier '${req.file.originalname}' traité.` });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
