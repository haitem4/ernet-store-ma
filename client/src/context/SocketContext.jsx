// ============================================================
// ERNET STORE — Contexte Socket.IO (temps réel)
// Notifications, stock, suivi commandes en direct
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [stockUpdates, setStockUpdates] = useState([]);

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('ernet_token');
      if (!token) return; // Sécurité

      const newSocket = io('/', {
        auth: { token },
        transports: ['websocket', 'polling'],
      });

      newSocket.on('connect', () => console.log('🔌 Socket connecté'));

      // Notifications temps réel
      newSocket.on('notification', (n) => {
        setNotifications((prev) => [n, ...prev]);
      });

      // Mises à jour de stock
      newSocket.on('stock:updated', (data) => {
        setStockUpdates((prev) => [data, ...prev].slice(0, 20));
      });

      // Suivi commandes
      newSocket.on('order:updated', (order) => {
        console.log('📦 Commande mise à jour:', order);
      });

      // S'abonner aux mises à jour de stock
      newSocket.emit('subscribe:stock');

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
        setSocket(null);
      };
    }
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, notifications, stockUpdates }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
