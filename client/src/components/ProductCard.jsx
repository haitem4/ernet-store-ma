// ============================================================
// ERNET STORE — ProductCard (Disway-style product card)
// ============================================================
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { userApi } from '../api/client.js';
import { CartIcon, HeartIcon, TruckIcon, ShieldIcon } from './Icons.jsx';

function formatPrice(price, lang) {
  if (!price) return '—';
  return new Intl.NumberFormat(lang === 'fr' ? 'fr-MA' : 'en-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

function getStockStatus(stock) {
  if (stock > 20) return { label: 'En stock', class: 'in-stock' };
  if (stock > 0) return { label: 'Stock limité', class: 'low-stock' };
  return { label: 'Rupture', class: 'out-of-stock' };
}

export default function ProductCard({
  product,
  variant = 'default', // default, compact, featured
  showAddToCart = true,
  priority = false,
}) {
  const { t, lang } = useLanguage();
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const stockStatus = getStockStatus(product?.stock || 0);
  const hasDiscount = product?.compareAt && product.compareAt > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id) return;
    setAdding(true);
    try {
      await addItem(product.id, 1);
    } catch (err) {
      console.error('Add to cart failed:', err);
    } finally {
      setTimeout(() => setAdding(false), 300);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product?.id) return;
    const nextState = !wishlisted;
    setWishlisted(nextState);
    if (isAuthenticated) {
      try {
        if (nextState) {
          await userApi.wishlist.add(product.id);
        } else {
          await userApi.wishlist.remove(product.id);
        }
      } catch (err) {
        console.warn('Wishlist update failed:', err.message);
      }
    }
  };

  const imageUrl = product?.images?.[0] || '/assets/placeholder-product.svg';

  if (variant === 'compact') {
    return (
      <Link to={`/produit/${product.slug}`} className="product-card product-card--compact">
        <div className="product-card-image">
          <img
            src={imageUrl}
            alt={product?.name}
            loading="lazy"
            width="80"
            height="80"
          />
        </div>
        <div className="product-card-info">
          <h4 className="product-card-name">{product?.name}</h4>
          <div className="product-card-price-row">
            <span className="product-card-price">{formatPrice(product?.price, lang)}</span>
            {hasDiscount && (
              <span className="product-card-old-price">{formatPrice(product?.compareAt, lang)}</span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <article className={`product-card product-card--${variant}`}>
      <div className="product-card-badge-group">
        {hasDiscount && (
          <span className="badge badge--promo">-{discountPercent}%</span>
        )}
        {product?.isNew && <span className="badge badge--new">{t('new')}</span>}
        {product?.isFeatured && <span className="badge badge--featured">{t('hot') || 'Top'}</span>}
        {product?.supplier && <span className="badge badge--supplier">{product.supplier}</span>}
      </div>

      <Link to={`/produit/${product.slug}`} className="product-card-link" aria-label={`Voir ${product?.name}`}>
        <div className="product-card-image">
          <img
            src={imageUrl}
            alt={product?.name}
            loading={priority ? 'eager' : 'lazy'}
            width="300"
            height="300"
          />
        </div>
      </Link>

      <div className="product-card-body">
        <div className="product-card-brand">{product?.brand?.name || product?.brand}</div>
        <Link to={`/produit/${product.slug}`} className="product-card-name-link">
          <h3 className="product-card-name">{product?.name}</h3>
        </Link>

        {/* Specs tags */}
        {product?.specs && Object.keys(product.specs).length > 0 && (
          <div className="product-card-specs">
            {Object.entries(product.specs).slice(0, 3).map(([key, value]) => (
              <span key={key} className="spec-tag">
                {value}
              </span>
            ))}
          </div>
        )}

        {/* Stock & Price */}
        <div className="product-card-footer">
          <div className="product-card-price-group">
            <span className="product-card-price">{formatPrice(product?.price, lang)}</span>
            {hasDiscount && (
              <span className="product-card-old-price">{formatPrice(product?.compareAt, lang)}</span>
            )}
          </div>
          <span className={`stock-badge ${stockStatus.class}`}>
            {stockStatus.label}
          </span>
        </div>

        {/* Actions */}
        {showAddToCart && (
          <div className="product-card-actions">
            <button
              className={`btn btn-primary btn-add-cart ${adding ? 'adding' : ''}`}
              onClick={handleAddToCart}
              disabled={adding || product?.stock === 0}
              aria-label={adding ? 'Ajout en cours...' : `Ajouter ${product?.name} au panier`}
            >
              <CartIcon size={18} />
              <span>{adding ? 'Ajouté ✓' : t('addToCart')}</span>
            </button>
            <button
              className="btn btn-icon btn-wishlist"
              onClick={handleWishlist}
              aria-label={wishlisted ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              aria-pressed={wishlisted}
            >
              <HeartIcon size={20} filled={wishlisted} />
            </button>
          </div>
        )}
      </div>

      {/* Trust indicators for B2B */}
      {product?.supplier && (
        <div className="product-card-trust">
          <span className="trust-item">
            <TruckIcon size={14} /> Livraison rapide
          </span>
          <span className="trust-item">
            <ShieldIcon size={14} /> Garantie {product.warranty || '1 an'}
          </span>
        </div>
      )}
    </article>
  );
}