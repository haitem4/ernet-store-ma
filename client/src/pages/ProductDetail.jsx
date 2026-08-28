// ============================================================
// ERNET STORE — Fiche produit détaillée
// ============================================================
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/products/${slug}`)
      .then((res) => setProduct(res.data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <section className="section">
        <div className="container text-center">
          <p>Chargement...</p>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="section">
        <div className="container text-center">
          <h2>Produit introuvable</h2>
          <Link to="/catalogue" className="btn btn-primary mt-24">
            Retour au catalogue
          </Link>
        </div>
      </section>
    );
  }

  const isB2B = user?.role === 'B2B';
  const displayPrice = isB2B && product.costPrice ? product.costPrice : product.price;
  const stockLabel =
    product.stock > 0 ? (product.stock <= 5 ? 'Stock limité' : 'En stock') : 'Sur commande';
  const stockClass = product.stock <= 5 ? 'low-stock' : 'in-stock';

  return (
    <>
      <section className="section">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Accueil</a> <span className="sep">/</span>
            <a href="/catalogue">Catalogue</a> <span className="sep">/</span>
            <span>{product.name}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48 }}>
            {/* Image */}
            <div
              className="product-img"
              style={{ height: 400, borderRadius: 'var(--radius)', overflow: 'hidden' }}
            >
              {product.images?.[0] ? (
                <img
                  src={
                    product.images[0].startsWith('/') ? product.images[0] : `/${product.images[0]}`
                  }
                  alt={product.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              ) : (
                <svg width="200" height="200" viewBox="0 0 100 100" fill="none">
                  <rect x="20" y="30" width="60" height="50" rx="4" fill="#e2e8f0" />
                  <rect x="30" y="40" width="15" height="15" rx="2" fill="#cbd5e1" />
                  <rect x="50" y="40" width="15" height="15" rx="2" fill="#cbd5e1" />
                  <rect x="30" y="60" width="30" height="4" rx="2" fill="#cbd5e1" />
                </svg>
              )}
            </div>

            {/* Info */}
            <div>
              <div className="product-brand">{product.brand?.name || 'ERNET'}</div>
              <h1 style={{ fontSize: '1.8rem', marginBottom: 16 }}>{product.name}</h1>

              <div className="product-specs" style={{ marginBottom: 16 }}>
                {product.specs &&
                  Object.entries(product.specs).map(([k, v]) => <span key={k}>{v}</span>)}
              </div>

              <div className="flex-between" style={{ marginBottom: 24 }}>
                <span className={`product-stock ${stockClass}`}>{stockLabel}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                  SKU: {product.sku}
                </span>
              </div>

              <div
                style={{
                  fontSize: '2.2rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  marginBottom: 8,
                }}
              >
                {Number(displayPrice).toLocaleString('fr-FR')} DH
                {product.compareAt && (
                  <span
                    className="old"
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 400,
                      color: 'var(--text-light)',
                      textDecoration: 'line-through',
                      marginLeft: 12,
                    }}
                  >
                    {Number(product.compareAt).toLocaleString('fr-FR')} DH
                  </span>
                )}
              </div>

              {isB2B && product.costPrice && (
                <p style={{ fontSize: '0.85rem', color: 'var(--success)', marginBottom: 16 }}>
                  ✓ Prix professionnel B2B appliqué
                </p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                  }}
                >
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ border: 'none' }}
                    onClick={() => setQty(Math.max(1, qty - 1))}
                  >
                    −
                  </button>
                  <span style={{ padding: '0 16px', fontWeight: 700 }}>{qty}</span>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ border: 'none' }}
                    onClick={() => setQty(qty + 1)}
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  style={{ flex: 1, justifyContent: 'center' }}
                  onClick={() => addItem(product.id, qty)}
                >
                  🛒 Ajouter au panier
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {[
                  ['🚚', 'Livraison 24-48h'],
                  ['🛡️', 'Garantie constructeur'],
                  ['💳', 'Paiement sécurisé'],
                ].map(([icon, label]) => (
                  <div
                    key={label}
                    style={{
                      textAlign: 'center',
                      padding: 12,
                      background: 'var(--bg-alt)',
                      borderRadius: 8,
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{icon}</div>
                    {label}
                  </div>
                ))}
              </div>

              {product.description && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ marginBottom: 8 }}>Description</h3>
                  <p style={{ color: 'var(--text-light)' }}>{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
