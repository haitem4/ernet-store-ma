// ============================================================
// ERNET STORE — Client API (axios)
// ============================================================
import axios from 'axios';

const SESSION_KEY = 'ernet_session';

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
  timeout: 4000, // Évite les blocages et lags prolongés sur Netlify
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ernet_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Session-Id'] = getSessionId();
  return config;
});

api.interceptors.response.use(
  (res) => {
    // Si Netlify renvoie index.html (string) au lieu du JSON d'API attendu
    if (typeof res.data === 'string' && (res.data.includes('<!doctype') || res.data.includes('<html'))) {
      return Promise.reject(new Error('Netlify SPA returned HTML instead of API JSON'));
    }
    return res;
  },
  (err) => {
    const status = err.response?.status;
    const url = err.config?.url || '';
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/me');
    const publicPath = ['/login', '/register'].includes(window.location.pathname);

    if (status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('ernet_token');
      localStorage.removeItem('ernet_user');
      if (!publicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export { api };

function listPayload(res) {
  const data = res.data;
  const hits = data.hits || data.products || (Array.isArray(data) ? data : []);
  return { ...res, data: { ...data, hits, products: hits, total: data.total ?? hits.length } };
}

// ============ PRODUITS ============
export const productsApi = {
  list: (params = {}) => api.get('/products', { params }).then(listPayload),
  get: (slug) => api.get(`/products/${slug}`),
  getById: (id) => api.get(`/products/id/${id}`),
  featured: () => api.get('/products/featured'),
  new: (params = {}) => api.get('/products', { params: { ...params, sort: 'newest' } }).then(listPayload),
  search: (q, params = {}) => api.get('/products', { params: { q, ...params } }).then(listPayload),
  meta: () => api.get('/products/meta'),
};

// ============ CATÉGORIES & MARQUES (via /products/meta) ============
export const categoriesApi = {
  list: () => api.get('/products/meta').then((res) => res.data.categories || []),
  get: (slug) => api.get(`/products?category=${slug}`).then(listPayload),
  tree: () => api.get('/products/meta').then((res) => res.data.categories || []),
};

// ============ MARQUES ============
export const brandsApi = {
  list: () => api.get('/products/meta').then((res) => res.data.brands || []),
  get: (slug) => api.get(`/products?brand=${slug}`).then(listPayload),
  getProducts: (slug, params = {}) =>
    api.get('/products', { params: { ...params, brand: slug } }).then(listPayload),
};

// ============ PANIER ============
export const cartApi = {
  get: () => api.get('/cart'),
  add: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }),
  update: (itemId, quantity) => api.patch(`/cart/items/${itemId}`, { quantity }),
  remove: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
  merge: () => api.post('/cart/merge'),
};

// ============ COMMANDES ============
export const ordersApi = {
  list: () => api.get('/orders'),
  get: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  cancel: (id) => api.post(`/orders/${id}/cancel`),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
};

// ============ AUTH ============
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token) => api.post('/auth/verify-email', { token }),
};

// ============ UTILISATEUR ============
export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  updatePassword: (data) => api.put('/user/password', data),
  addresses: {
    list: () => api.get('/user/addresses'),
    add: (data) => api.post('/user/addresses', data),
    update: (id, data) => api.put(`/user/addresses/${id}`, data),
    delete: (id) => api.delete(`/user/addresses/${id}`),
    setDefault: (id) => api.post(`/user/addresses/${id}/default`),
  },
  wishlist: {
    list: () => api.get('/user/wishlist'),
    add: (productId) => api.post('/user/wishlist', { productId }),
    remove: (productId) => api.delete(`/user/wishlist/${productId}`),
  },
  notifications: {
    list: (params = {}) => api.get('/user/notifications', { params }),
    markRead: (id) => api.post(`/user/notifications/${id}/read`),
    markAllRead: () => api.post('/user/notifications/read-all'),
  },
};

// ============ DEVIS (B2B) ============
export const quotesApi = {
  list: () => api.get('/quotes'),
  get: (id) => api.get(`/quotes/${id}`),
  create: (data) => api.post('/quotes', data),
};

// ============ ADMIN ============
export const adminApi = {
  syncDisway: () => api.post('/admin/sync/disway'),
  import: {
    upload: (formData) =>
      api.post('/admin/sync/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    status: () => api.get('/admin/import/status'),
    history: () => api.get('/admin/import/history'),
  },
  products: {
    create: (data) => api.post('/admin/products', data),
    update: (id, data) => api.put(`/admin/products/${id}`, data),
    delete: (id) => api.delete(`/admin/products/${id}`),
    bulkUpdate: (ids, data) => api.put('/admin/products/bulk', { ids, data }),
  },
  orders: {
    list: (params = {}) => api.get('/admin/orders', { params }),
    updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  },
  stats: {
    dashboard: () => api.get('/admin/stats'),
    sales: (params = {}) => api.get('/admin/stats/sales', { params }),
  },
};

export default api;
