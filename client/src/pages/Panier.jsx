// ============================================================
// ERNET STORE — Panier d'achat
// ============================================================
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';

export default function Panier() {
  const { items, subtotal, count, updateItem, removeItem, clearCart, loading } = useCart();

  const shipping = subtotal >= 2000 ? 0 : 50;
  const total = subtotal + shipping;

  if (loading) {
    return (
      <section className="section">
        <div className="container text-center">
          <p>Chargement du panier...</p>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="section">
        <div className="container text-center">
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>🛒</div>
          <h2>Votre panier est vide</h2>
          <p className="mt-16" style={{ color: 'var(--text-light)' }}>
            Découvrez nos produits et ajoutez-les à votre panier.
          </p>
          <Link to="/catalogue" className="btn btn-primary mt-24">
            Explorer le catalogue
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Accueil</Link> <span className="sep">/</span> <span>Panier</span>
          </div>
          <h1>
            <span className="gradient-text">Mon panier</span>
          </h1>
          <p>{count} article(s) dans votre panier</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="catalogue-layout">
            <div>
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="panel"
                  style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}
                >
                  <div
                    className="product-img"
                    style={{
                      width: 100,
                      height: 100,
                      flexShrink: 0,
                      borderRadius: 'var(--radius)',
                      overflow: 'hidden',
                    }}
                  >
                    {item.product?.images?.[0] ? (
                      <img
                        src={
                          item.product.images[0].startsWith('/')
                            ? item.product.images[0]
                            : `/${item.product.images[0]}`
                        }
                        alt={item.product?.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        loading="lazy"
                      />
                    ) : (
                      <svg width="60" height="60" viewBox="0 0 100 100" fill="none">
                        <rect x="20" y="30" width="60" height="50" rx="4" fill="#e2e8f0" />
                        <rect x="30" y="40" width="15" height="15" rx="2" fill="#cbd5e1" />
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="product-brand">{item.product?.brand?.name || 'ERNET'}</div>
                    <h3 style={{ fontSize: '1rem', marginBottom: 8 }}>{item.product?.name}</h3>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>
                      {Number(item.price).toLocaleString('fr-FR')} DH / unité
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => updateItem(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      −
                    </button>
                    <span style={{ fontWeight: 700, minWidth: 30, textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => updateItem(item.productId, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div
                    style={{
                      fontWeight: 700,
                      color: 'var(--primary)',
                      minWidth: 100,
                      textAlign: 'right',
                    }}
                  >
                    {Number(item.price * item.quantity).toLocaleString('fr-FR')} DH
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => removeItem(item.productId)}
                    aria-label="Supprimer"
                  >
                    🗑️
                  </button>
                </div>
              ))}
              <button className="btn btn-outline btn-sm" onClick={clearCart}>
                Vider le panier
              </button>
            </div>

            <div className="filters-sidebar" style={{ position: 'sticky', top: 130 }}>
              <h3>Récapitulatif</h3>
              <div
                className="flex-between"
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.9rem',
                }}
              >
                <span>Sous-total</span>
                <span>{Number(subtotal).toLocaleString('fr-FR')} DH</span>
              </div>
              <div
                className="flex-between"
                style={{
                  padding: '10px 0',
                  borderBottom: '1px solid var(--border)',
                  fontSize: '0.9rem',
                }}
              >
                <span>Livraison</span>
                <span>{shipping === 0 ? 'Gratuite' : `${shipping} DH`}</span>
              </div>
              <div
                className="flex-between"
                style={{ padding: '16px 0', fontSize: '1.1rem', fontWeight: 700 }}
              >
                <span>Total</span>
                <span style={{ color: 'var(--primary)' }}>
                  {Number(total).toLocaleString('fr-FR')} DH
                </span>
              </div>
              <Link
                to="/espace-pro"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Passer la commande →
              </Link>
              <p
                className="mt-16"
                style={{ fontSize: '0.8rem', color: 'var(--text-light)', textAlign: 'center' }}
              >
                Paiement sécurisé : CMI, virement, paiement à la livraison
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
