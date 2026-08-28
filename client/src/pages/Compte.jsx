// ============================================================
// ERNET STORE — Tableau de bord client (B2B & B2C)
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api, { quotesApi, userApi } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Compte() {
  const { user, logout, updateProfile, updatePassword } = useAuth();
  const { addItem } = useCart();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Données
  const [orders, setOrders] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Formulaires
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    companyReg: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [addressForm, setAddressForm] = useState({
    label: '',
    city: '',
    address: '',
    postal: '',
    phone: '',
    isDefault: false,
  });
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [ordersRes, quotesRes, wishlistRes, addressesRes] = await Promise.allSettled([
        api.get('/orders'),
        quotesApi.list(),
        userApi.wishlist.list(),
        userApi.addresses.list(),
      ]);

      if (ordersRes.status === 'fulfilled') {
        const list = Array.isArray(ordersRes.value.data)
          ? ordersRes.value.data
          : ordersRes.value.data?.orders || [];
        setOrders(list);
      }
      if (quotesRes.status === 'fulfilled') {
        const qList = Array.isArray(quotesRes.value.data) ? quotesRes.value.data : [];
        setQuotes(qList);
      }
      if (wishlistRes.status === 'fulfilled') {
        const wList = Array.isArray(wishlistRes.value.data) ? wishlistRes.value.data : [];
        setWishlist(wList);
      }
      if (addressesRes.status === 'fulfilled') {
        const aList = Array.isArray(addressesRes.value.data) ? addressesRes.value.data : [];
        setAddresses(aList);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        companyName: user.companyName || '',
        companyReg: user.companyReg || '',
      });
    }
  }, [loadData, user]);

  if (!user) {
    return (
      <section className="section">
        <div className="container text-center">
          <h2>Veuillez vous connecter</h2>
          <p className="mt-16">Accédez à votre espace client.</p>
          <Link to="/login" className="btn btn-primary mt-24">
            Se connecter
          </Link>
        </div>
      </section>
    );
  }

  const statusClass = {
    DELIVERED: 'status-delivered',
    CONFIRMED: 'status-paid',
    PROCESSING: 'status-processing',
    PAID: 'status-paid',
    PENDING: 'status-pending',
    CANCELLED: 'status-cancelled',
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    try {
      await updateProfile(profileForm);
      setFeedback({ type: 'success', message: 'Profil mis à jour avec succès !' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Erreur lors de la mise à jour du profil.',
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setFeedback({ type: '', message: '' });
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setFeedback({ type: 'error', message: 'Les nouveaux mots de passe ne correspondent pas.' });
      return;
    }
    try {
      await updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setFeedback({ type: 'success', message: 'Mot de passe modifié avec succès !' });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Erreur lors du changement de mot de passe.',
      });
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await userApi.addresses.add(addressForm);
      setShowAddressModal(false);
      setAddressForm({
        label: '',
        city: '',
        address: '',
        postal: '',
        phone: '',
        isDefault: false,
      });
      const res = await userApi.addresses.list();
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || "Erreur lors de l'ajout de l'adresse.");
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Supprimer cette adresse ?')) return;
    try {
      await userApi.addresses.delete(id);
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de suppression.');
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      await userApi.addresses.setDefault(id);
      const res = await userApi.addresses.list();
      setAddresses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de mise à jour.');
    }
  };

  const handleRemoveWishlist = async (productId) => {
    try {
      await userApi.wishlist.remove(productId);
      setWishlist((prev) => prev.filter((item) => item.productId !== productId));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur de suppression.');
    }
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
  ).length;

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Accueil</Link> <span className="sep">/</span> <span>Mon compte</span>
          </div>
          <h1>
            <span className="gradient-text">Bonjour, {user.firstName} 👋</span>
          </h1>
          <p>{user.role === 'B2B' ? 'Espace client — professionnel (B2B)' : 'Espace client'}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="dashboard-layout">
            <aside className="dashboard-sidebar">
              <div className="dash-user">
                <div className="dash-avatar">{user.firstName?.[0]?.toUpperCase()}</div>
                <div>
                  <h4>
                    {user.firstName} {user.lastName}
                  </h4>
                  <p>{user.email}</p>
                  {user.companyName && (
                    <span
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--primary)',
                        fontWeight: 600,
                      }}
                    >
                      🏢 {user.companyName}
                    </span>
                  )}
                </div>
              </div>
              <nav className="dash-nav">
                <button
                  className={activeTab === 'dashboard' ? 'active' : ''}
                  onClick={() => {
                    setActiveTab('dashboard');
                    setSelectedOrder(null);
                  }}
                >
                  📊 Tableau de bord
                </button>
                <button
                  className={activeTab === 'orders' ? 'active' : ''}
                  onClick={() => {
                    setActiveTab('orders');
                    setSelectedOrder(null);
                  }}
                >
                  🛒 Mes commandes ({orders.length})
                </button>
                <button
                  className={activeTab === 'quotes' ? 'active' : ''}
                  onClick={() => {
                    setActiveTab('quotes');
                    setSelectedOrder(null);
                  }}
                >
                  📝 Devis en ligne ({quotes.length})
                </button>
                <button
                  className={activeTab === 'wishlist' ? 'active' : ''}
                  onClick={() => {
                    setActiveTab('wishlist');
                    setSelectedOrder(null);
                  }}
                >
                  ❤️ Mes favoris ({wishlist.length})
                </button>
                <button
                  className={activeTab === 'addresses' ? 'active' : ''}
                  onClick={() => {
                    setActiveTab('addresses');
                    setSelectedOrder(null);
                  }}
                >
                  📍 Adresses ({addresses.length})
                </button>
                <button
                  className={activeTab === 'settings' ? 'active' : ''}
                  onClick={() => {
                    setActiveTab('settings');
                    setSelectedOrder(null);
                  }}
                >
                  ⚙️ Paramètres
                </button>
                <button
                  onClick={logout}
                  style={{ color: 'var(--error)', textAlign: 'left', background: 'none' }}
                >
                  🚪 Déconnexion
                </button>
              </nav>
            </aside>

            <div>
              {/* Onglet TABLEAU DE BORD */}
              {activeTab === 'dashboard' && (
                <>
                  <div className="dash-stats">
                    <div
                      className="dash-stat"
                      onClick={() => setActiveTab('orders')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="dash-stat-icon">🛒</div>
                      <div className="dash-stat-value">{orders.length}</div>
                      <div className="dash-stat-label">Commandes</div>
                    </div>
                    <div
                      className="dash-stat"
                      onClick={() => setActiveTab('orders')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="dash-stat-icon">💳</div>
                      <div className="dash-stat-value">{activeOrdersCount}</div>
                      <div className="dash-stat-label">En cours</div>
                    </div>
                    <div
                      className="dash-stat"
                      onClick={() => setActiveTab('quotes')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="dash-stat-icon">💼</div>
                      <div className="dash-stat-value">{quotes.length}</div>
                      <div className="dash-stat-label">Devis</div>
                    </div>
                    <div
                      className="dash-stat"
                      onClick={() => setActiveTab('wishlist')}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="dash-stat-icon">❤️</div>
                      <div className="dash-stat-value">{wishlist.length}</div>
                      <div className="dash-stat-label">Favoris</div>
                    </div>
                  </div>

                  <div className="panel">
                    <div className="flex-between" style={{ marginBottom: 16 }}>
                      <h3>Commandes récentes</h3>
                      {orders.length > 0 && (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setActiveTab('orders')}
                        >
                          Voir tout ({orders.length})
                        </button>
                      )}
                    </div>
                    {loading ? (
                      <p className="text-center">Chargement...</p>
                    ) : orders.length === 0 ? (
                      <div className="text-center" style={{ padding: '24px 0' }}>
                        <p style={{ color: 'var(--text-light)', marginBottom: 16 }}>
                          Aucune commande pour le moment.
                        </p>
                        <Link to="/catalogue" className="btn btn-primary btn-sm">
                          Explorer le catalogue
                        </Link>
                      </div>
                    ) : (
                      <div className="table-responsive">
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Commande</th>
                              <th>Date</th>
                              <th>Total</th>
                              <th>Statut</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.slice(0, 5).map((o) => (
                              <tr key={o.id}>
                                <td>
                                  <strong>#{o.orderNumber}</strong>
                                </td>
                                <td>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                                <td>{Number(o.total).toLocaleString('fr-FR')} DH</td>
                                <td>
                                  <span
                                    className={`status-badge ${statusClass[o.status] || 'status-pending'}`}
                                  >
                                    {o.status}
                                  </span>
                                </td>
                                <td>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => {
                                      setSelectedOrder(o);
                                      setActiveTab('orders');
                                    }}
                                  >
                                    Détails
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Onglet COMMANDES */}
              {activeTab === 'orders' && (
                <div className="panel">
                  {selectedOrder ? (
                    <div>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ marginBottom: 16 }}
                        onClick={() => setSelectedOrder(null)}
                      >
                        ← Retour à la liste
                      </button>
                      <h3>Commande #{selectedOrder.orderNumber}</h3>
                      <p style={{ color: 'var(--text-light)', marginBottom: 20 }}>
                        Passée le {new Date(selectedOrder.createdAt).toLocaleString('fr-FR')} •{' '}
                        <span
                          className={`status-badge ${statusClass[selectedOrder.status] || 'status-pending'}`}
                        >
                          {selectedOrder.status}
                        </span>{' '}
                        • Paiement : <strong>{selectedOrder.paymentStatus}</strong> (
                        {selectedOrder.paymentMethod})
                      </p>

                      <h4>Articles commandés</h4>
                      <div className="table-responsive" style={{ margin: '16px 0' }}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Produit</th>
                              <th>Prix unit.</th>
                              <th>Quantité</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.items?.map((item) => (
                              <tr key={item.id}>
                                <td>{item.name || item.product?.name}</td>
                                <td>{Number(item.price).toLocaleString('fr-FR')} DH</td>
                                <td>{item.quantity}</td>
                                <td>{Number(item.total).toLocaleString('fr-FR')} DH</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div
                        style={{
                          background: 'var(--bg-alt)',
                          padding: 16,
                          borderRadius: 8,
                          maxWidth: 320,
                          marginLeft: 'auto',
                        }}
                      >
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <span>Sous-total:</span>
                          <span>{Number(selectedOrder.subtotal).toLocaleString('fr-FR')} DH</span>
                        </div>
                        <div className="flex-between" style={{ marginBottom: 8 }}>
                          <span>Livraison:</span>
                          <span>
                            {Number(selectedOrder.shipping) === 0
                              ? 'Gratuite'
                              : `${selectedOrder.shipping} DH`}
                          </span>
                        </div>
                        <div
                          className="flex-between"
                          style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}
                        >
                          <span>Total:</span>
                          <span>{Number(selectedOrder.total).toLocaleString('fr-FR')} DH</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3>Mes commandes</h3>
                      {orders.length === 0 ? (
                        <p style={{ color: 'var(--text-light)', marginTop: 12 }}>
                          Vous n'avez pas encore passé de commande.
                        </p>
                      ) : (
                        <div className="table-responsive" style={{ marginTop: 16 }}>
                          <table className="table">
                            <thead>
                              <tr>
                                <th>Commande</th>
                                <th>Date</th>
                                <th>Total</th>
                                <th>Paiement</th>
                                <th>Statut</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {orders.map((o) => (
                                <tr key={o.id}>
                                  <td>
                                    <strong>#{o.orderNumber}</strong>
                                  </td>
                                  <td>{new Date(o.createdAt).toLocaleDateString('fr-FR')}</td>
                                  <td>{Number(o.total).toLocaleString('fr-FR')} DH</td>
                                  <td>{o.paymentStatus}</td>
                                  <td>
                                    <span
                                      className={`status-badge ${statusClass[o.status] || 'status-pending'}`}
                                    >
                                      {o.status}
                                    </span>
                                  </td>
                                  <td>
                                    <button
                                      className="btn btn-outline btn-sm"
                                      onClick={() => setSelectedOrder(o)}
                                    >
                                      Détails
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Onglet DEVIS */}
              {activeTab === 'quotes' && (
                <div className="panel">
                  <h3>Mes devis B2B</h3>
                  {quotes.length === 0 ? (
                    <div style={{ marginTop: 16 }}>
                      <p style={{ color: 'var(--text-light)', marginBottom: 16 }}>
                        Aucune demande de devis en cours.
                      </p>
                      <Link to="/espace-pro" className="btn btn-outline btn-sm">
                        En savoir plus sur les devis B2B
                      </Link>
                    </div>
                  ) : (
                    <div className="table-responsive" style={{ marginTop: 16 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>N° Devis</th>
                            <th>Date</th>
                            <th>Statut</th>
                            <th>Message</th>
                            <th>Total estimé</th>
                          </tr>
                        </thead>
                        <tbody>
                          {quotes.map((q) => (
                            <tr key={q.id}>
                              <td>
                                <strong>#{q.quoteNumber}</strong>
                              </td>
                              <td>{new Date(q.createdAt).toLocaleDateString('fr-FR')}</td>
                              <td>
                                <span className="status-badge status-pending">{q.status}</span>
                              </td>
                              <td>{q.message || '—'}</td>
                              <td>
                                {q.total ? `${Number(q.total).toLocaleString('fr-FR')} DH` : 'En attente'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet FAVORIS */}
              {activeTab === 'wishlist' && (
                <div className="panel">
                  <h3>Mes favoris ({wishlist.length})</h3>
                  {wishlist.length === 0 ? (
                    <p style={{ color: 'var(--text-light)', marginTop: 16 }}>
                      Vous n'avez pas encore ajouté de produits à vos favoris.
                    </p>
                  ) : (
                    <div className="table-responsive" style={{ marginTop: 16 }}>
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Produit</th>
                            <th>Marque</th>
                            <th>Prix</th>
                            <th>Stock</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {wishlist.map((item) => (
                            <tr key={item.id}>
                              <td>
                                <Link
                                  to={`/produit/${item.product?.slug}`}
                                  style={{ fontWeight: 600, color: 'var(--primary)' }}
                                >
                                  {item.product?.name}
                                </Link>
                              </td>
                              <td>{item.product?.brand?.name || '—'}</td>
                              <td>{Number(item.product?.price || 0).toLocaleString('fr-FR')} DH</td>
                              <td>{item.product?.stock > 0 ? 'En stock' : 'Rupture'}</td>
                              <td style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className="btn btn-primary btn-sm"
                                  onClick={() => addItem(item.productId, 1)}
                                  disabled={item.product?.stock <= 0}
                                >
                                  🛒 Panier
                                </button>
                                <button
                                  className="btn btn-outline btn-sm"
                                  onClick={() => handleRemoveWishlist(item.productId)}
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet ADRESSES */}
              {activeTab === 'addresses' && (
                <div className="panel">
                  <div className="flex-between" style={{ marginBottom: 16 }}>
                    <h3>Mes adresses de livraison</h3>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowAddressModal(true)}
                    >
                      + Ajouter une adresse
                    </button>
                  </div>

                  {addresses.length === 0 ? (
                    <p style={{ color: 'var(--text-light)' }}>
                      Aucune adresse enregistrée. Ajoutez-en une pour faciliter vos prochaines
                      commandes.
                    </p>
                  ) : (
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: 16,
                      }}
                    >
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          style={{
                            border: '1px solid var(--border)',
                            borderRadius: 8,
                            padding: 16,
                            background: addr.isDefault ? 'var(--bg-alt)' : 'transparent',
                          }}
                        >
                          <div className="flex-between" style={{ marginBottom: 8 }}>
                            <strong>{addr.label}</strong>
                            {addr.isDefault && (
                              <span
                                style={{
                                  fontSize: '0.75rem',
                                  background: 'var(--primary)',
                                  color: '#fff',
                                  padding: '2px 6px',
                                  borderRadius: 4,
                                }}
                              >
                                Par défaut
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                            {addr.address}
                          </p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                            {addr.city} {addr.postal ? `(${addr.postal})` : ''}
                          </p>
                          {addr.phone && (
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                              📞 {addr.phone}
                            </p>
                          )}

                          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                            {!addr.isDefault && (
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleSetDefaultAddress(addr.id)}
                              >
                                Définir par défaut
                              </button>
                            )}
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => handleDeleteAddress(addr.id)}
                              style={{ color: 'var(--error)' }}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {showAddressModal && (
                    <div
                      style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                      }}
                    >
                      <div
                        style={{
                          background: '#fff',
                          padding: 24,
                          borderRadius: 8,
                          width: '100%',
                          maxWidth: 440,
                        }}
                      >
                        <h3 style={{ marginBottom: 16 }}>Nouvelle adresse</h3>
                        <form onSubmit={handleAddAddress} style={{ display: 'grid', gap: 12 }}>
                          <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                              Libellé (ex: Bureau, Domicile)
                            </label>
                            <input
                              type="text"
                              required
                              value={addressForm.label}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, label: e.target.value })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ville</label>
                            <input
                              type="text"
                              required
                              value={addressForm.city}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, city: e.target.value })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Adresse</label>
                            <input
                              type="text"
                              required
                              value={addressForm.address}
                              onChange={(e) =>
                                setAddressForm({ ...addressForm, address: e.target.value })
                              }
                              style={{ width: '100%' }}
                            />
                          </div>
                          <div
                            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}
                          >
                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                Code postal
                              </label>
                              <input
                                type="text"
                                value={addressForm.postal}
                                onChange={(e) =>
                                  setAddressForm({ ...addressForm, postal: e.target.value })
                                }
                                style={{ width: '100%' }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                Téléphone
                              </label>
                              <input
                                type="text"
                                value={addressForm.phone}
                                onChange={(e) =>
                                  setAddressForm({ ...addressForm, phone: e.target.value })
                                }
                                style={{ width: '100%' }}
                              />
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                              Enregistrer
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline"
                              onClick={() => setShowAddressModal(false)}
                            >
                              Annuler
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Onglet PARAMETRES */}
              {activeTab === 'settings' && (
                <div style={{ display: 'grid', gap: 24 }}>
                  {feedback.message && (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        color:
                          feedback.type === 'success' ? 'var(--success)' : 'var(--error)',
                      }}
                    >
                      {feedback.message}
                    </div>
                  )}

                  <div className="panel">
                    <h3 style={{ marginBottom: 16 }}>Informations personnelles</h3>
                    <form onSubmit={handleProfileSubmit} style={{ display: 'grid', gap: 16 }}>
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
                      >
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Prénom</label>
                          <input
                            type="text"
                            value={profileForm.firstName}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, firstName: e.target.value })
                            }
                            style={{ width: '100%' }}
                            required
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nom</label>
                          <input
                            type="text"
                            value={profileForm.lastName}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, lastName: e.target.value })
                            }
                            style={{ width: '100%' }}
                            required
                          />
                        </div>
                      </div>

                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
                      >
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Téléphone</label>
                          <input
                            type="text"
                            value={profileForm.phone}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, phone: e.target.value })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Société</label>
                          <input
                            type="text"
                            value={profileForm.companyName}
                            onChange={(e) =>
                              setProfileForm({ ...profileForm, companyName: e.target.value })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: 'fit-content' }}
                      >
                        Enregistrer les modifications
                      </button>
                    </form>
                  </div>

                  <div className="panel">
                    <h3 style={{ marginBottom: 16 }}>Sécurité & Mot de passe</h3>
                    <form onSubmit={handlePasswordSubmit} style={{ display: 'grid', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                          Mot de passe actuel
                        </label>
                        <input
                          type="password"
                          required
                          value={passwordForm.currentPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                          }
                          style={{ width: '100%' }}
                        />
                      </div>
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
                      >
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Nouveau mot de passe
                          </label>
                          <input
                            type="password"
                            required
                            minLength={8}
                            placeholder="Min. 8 caractères"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                              setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                            Confirmer le nouveau mot de passe
                          </label>
                          <input
                            type="password"
                            required
                            minLength={8}
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                              setPasswordForm({
                                ...passwordForm,
                                confirmPassword: e.target.value,
                              })
                            }
                            style={{ width: '100%' }}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: 'fit-content' }}
                      >
                        Changer le mot de passe
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
