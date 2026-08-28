// ============================================================
// ERNET STORE — Contexte d'authentification
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi, userApi } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('ernet_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      if (res.data.user) {
        setUser(res.data.user);
        localStorage.setItem('ernet_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      localStorage.removeItem('ernet_token');
      localStorage.removeItem('ernet_user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleAuthResponse = (res) => {
    const { token, user } = res.data;
    localStorage.setItem('ernet_token', token);
    localStorage.setItem('ernet_user', JSON.stringify(user));
    setUser(user);
    setError(null);
    return user;
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await authApi.login(email, password);
      return handleAuthResponse(res);
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec de la connexion';
      setError(msg);
      throw err;
    }
  };

  const register = async (data) => {
    setError(null);
    try {
      const res = await authApi.register(data);
      return handleAuthResponse(res);
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec de l\'inscription';
      setError(msg);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Logout API error:', err);
    }
    localStorage.removeItem('ernet_token');
    localStorage.removeItem('ernet_user');
    setUser(null);
  };

  const updateProfile = async (data) => {
    try {
      const res = await userApi.updateProfile(data);
      setUser(res.data.user);
      localStorage.setItem('ernet_user', JSON.stringify(res.data.user));
      return res.data.user;
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec de la mise à jour';
      setError(msg);
      throw err;
    }
  };

  const updatePassword = async (data) => {
    try {
      await userApi.updatePassword(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Échec de la mise à jour du mot de passe';
      setError(msg);
      throw err;
    }
  };

  const isB2B = user?.role === 'B2B';
  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        register,
        logout,
        updateProfile,
        updatePassword,
        isB2B,
        isAdmin,
        isAuthenticated,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}