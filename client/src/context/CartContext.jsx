// ============================================================
// ERNET STORE — Contexte panier
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { cartApi } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, loading: authLoading } = useAuth();
  const wasLoggedIn = useRef(false);

  const applyCart = (data) => {
    const itemsArray = Array.isArray(data) ? data : data?.items || [];
    const total =
      data?.subtotal ??
      itemsArray.reduce((sum, item) => sum + Number(item.price || 0) * item.quantity, 0);
    const itemCount = data?.count ?? itemsArray.reduce((sum, item) => sum + item.quantity, 0);
    setItems(itemsArray);
    setSubtotal(total);
    setCount(itemCount);
  };

  const reloadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cartApi.get();
      applyCart(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erreur de chargement du panier';
      setError(msg);
      setItems([]);
      setSubtotal(0);
      setCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;

    const sync = async () => {
      if (user && !wasLoggedIn.current) {
        try {
          await cartApi.merge();
        } catch {
          // Pas de panier invité à fusionner
        }
      }
      wasLoggedIn.current = !!user;
      await reloadCart();
    };

    sync();
  }, [user, authLoading, reloadCart]);

  const addItem = async (productId, quantity = 1) => {
    try {
      setError(null);
      await cartApi.add(productId, quantity);
      await reloadCart();
    } catch (err) {
      const msg = err.response?.data?.message || "Échec de l'ajout au panier";
      setError(msg);
      throw err;
    }
  };

  const removeItem = async (itemId) => {
    try {
      setError(null);
      await cartApi.remove(itemId);
      await reloadCart();
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec de la suppression';
      setError(msg);
      throw err;
    }
  };

  const updateItem = async (itemId, quantity) => {
    try {
      setError(null);
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }
      await cartApi.update(itemId, quantity);
      await reloadCart();
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec de la mise à jour';
      setError(msg);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      setError(null);
      await cartApi.clear();
      setItems([]);
      setSubtotal(0);
      setCount(0);
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec du vidage';
      setError(msg);
      throw err;
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        subtotal,
        count,
        loading,
        error,
        addItem,
        updateItem,
        removeItem,
        clearCart,
        reload: reloadCart,
        setError,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
