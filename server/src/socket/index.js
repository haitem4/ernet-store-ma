// ============================================================
// ERNET STORE — Socket.IO (communication temps réel)
// ============================================================
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import env from '../config/env.js';

let io = null;

/**
 * Initialise Socket.IO sur le serveur HTTP.
 * @param {import('http').Server} httpServer
 */
export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Middleware d'authentification par JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Non authentifié'));

    try {
      const payload = jwt.verify(token, env.jwtSecret);
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Client connecté: ${socket.id} (user: ${socket.userId})`);

    // Rejoindre sa room personnelle pour les notifications
    if (socket.userId) socket.join(`user:${socket.userId}`);

    // Abonnement aux mises à jour de stock
    socket.on('subscribe:stock', () => socket.join('stock:updates'));

    socket.on('disconnect', () => {
      console.log(`🔌 Client déconnecté: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Émet une mise à jour de stock en temps réel (ex: toute la boutique).
 * @param {object} data { productId, stock }
 */
export function emitStockUpdate(data) {
  if (!io) return;
  io.to('stock:updates').emit('stock:updated', data);
}

/**
 * Envoie une notification à un utilisateur spécifique.
 * @param {string} userId
 * @param {object} notification
 */
export function notifyUser(userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Émet un événement de commande mise à jour (suivi temps réel).
 * @param {string} userId
 * @param {object} order
 */
export function emitOrderUpdate(userId, order) {
  if (!io) return;
  io.to(`user:${userId}`).emit('order:updated', order);
}

export function getIO() {
  return io;
}

export default { initSocket, emitStockUpdate, notifyUser, emitOrderUpdate, getIO };
