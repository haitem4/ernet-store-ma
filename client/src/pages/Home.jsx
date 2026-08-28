// ============================================================
// ERNET STORE — Home Page (Disway-style)
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { productsApi } from '../api/client.js';
import { FALLBACK_PRODUCTS, FALLBACK_BRANDS } from '../data/fallbackProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import {
  TruckIcon,
  ShieldIcon,
  HeadphonesIcon,
  TagIcon,
  ArrowRightIcon,
  CategoryIcons,
} from '../components/Icons.jsx';

export default function Home() {
  const { t } = useLanguage();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('featured');
  const [stats, setStats] = useState({
    products: 120,
    brands: 50,
    clients: 2000,
    delivery: '24-48h',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [featuredRes, newRes, metaRes] = await Promise.all([
          productsApi.featured().catch(() => ({ data: [] })),
          productsApi.new().catch(() => ({ data: { hits: [] } })),
          productsApi.meta().catch(() => ({ data: { categories: [], brands: [] } })),
        ]);

        const featured = Array.isArray(featuredRes?.data)
          ? featuredRes.data
          : featuredRes?.data?.hits || [];
        const newest = newRes?.data?.hits || [];
        const brandList = metaRes?.data?.brands || [];
        const catList = metaRes?.data?.categories || [];
        const productCount = catList.reduce((sum, c) => sum + (c.count || 0), 0);

        setFeaturedProducts(featured.length > 0 ? featured : FALLBACK_PRODUCTS.filter(p => p.isFeatured));
        setNewProducts(newest.length > 0 ? newest : FALLBACK_PRODUCTS.filter(p => p.isNew));
        setBrands(brandList.length > 0 ? brandList : FALLBACK_BRANDS);
        setStats((prev) => ({
          ...prev,
          products: productCount || newest.length || FALLBACK_PRODUCTS.length,
          brands: brandList.length || FALLBACK_BRANDS.length,
        }));
      } catch (err) {
        console.warn('Home data fallback:', err.message);
        setFeaturedProducts(FALLBACK_PRODUCTS.filter(p => p.isFeatured));
        setNewProducts(FALLBACK_PRODUCTS.filter(p => p.isNew));
        setBrands(FALLBACK_BRANDS);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const displayedProducts =
    activeTab === 'new'
      ? newProducts
      : featuredProducts.length
        ? featuredProducts
        : newProducts;

  // Home categories (Disway style)
  const homeCategories = [
    { key: 'computers', label: t('catComputers'), icon: 'computers', href: '/catalogue?category=ordinateurs', count: '1 200+' },
    { key: 'servers', label: t('catServers'), icon: 'servers', href: '/catalogue?category=serveurs', count: '800+' },
    { key: 'networks', label: t('catNetworks'), icon: 'networks', href: '/catalogue?category=reseaux', count: '600+' },
    { key: 'peripherals', label: t('catPeripherals'), icon: 'peripherals', href: '/catalogue?category=peripheriques', count: '900+' },
    { key: 'brands', label: t('catBrands'), icon: 'brands', href: '/marques', count: '50+' },
    { key: 'deals', label: t('catDeals'), icon: 'deals', href: '/promotions', count: '200+' },
    { key: 'accessories', label: t('catAccessories'), icon: 'accessories', href: '/catalogue?category=accessoires', count: '500+' },
    { key: 'telephony', label: t('tabTelephony'), icon: 'telephony', href: '/catalogue?category=telephonie', count: '400+' },
  ];

  // Why choose us
  const advantages = [
    {
      icon: TruckIcon,
      title: t('fastDelivery'),
      description: t('fastDeliverySub'),
    },
    {
      icon: ShieldIcon,
      title: t('warranty'),
      description: t('warrantySub'),
    },
    {
      icon: HeadphonesIcon,
      title: t('techSupport'),
      description: t('techSupportSub'),
    },
    {
      icon: TagIcon,
      title: t('b2bPricing'),
      description: t('b2bPricingSub'),
    },
  ];

  if (loading) {
    return (
      <div className="page-home loading">
        <div className="hero-skeleton">
          <div className="skeleton skeleton-text" style={{ width: '60%', maxWidth: '600px' }} />
          <div className="skeleton skeleton-text" style={{ width: '80%', maxWidth: '800px', marginTop: '16px' }} />
          <div className="skeleton skeleton-button" style={{ marginTop: '24px' }} />
        </div>
        <div className="categories-skeleton">
          <div className="skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton skeleton-card" />
            ))}
          </div>
        </div>
        <div className="products-skeleton">
          <div className="skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="skeleton skeleton-product" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-home">
      {/* ============ HERO SECTION ============ */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-background" aria-hidden="true">
          <div className="hero-gradient" />
          <div className="hero-pattern" />
        </div>
        <div className="container hero-content">
          <div className="hero-text animate-fade-in-up">
            <span className="overline">{t('heroTitle')}</span>
            <h1 id="hero-title" className="hero-title">
              {t('heroTitle')}
            </h1>
            <p className="hero-subtitle">{t('heroSubtitle')}</p>
            <div className="hero-actions">
              <Link to="/catalogue" className="btn btn-primary btn-lg">
                {t('browseCatalog')}
                <ArrowRightIcon size={20} />
              </Link>
              <Link to="/register?type=b2b" className="btn btn-outline btn-lg">
                {t('becomeReseller')}
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <strong>{stats.products.toLocaleString()}+</strong>
                <span>{t('productsInStock')}</span>
              </div>
              <div className="stat">
                <strong>{stats.brands}+</strong>
                <span>{t('partnerBrands')}</span>
              </div>
              <div className="stat">
                <strong>{stats.clients}+</strong>
                <span>{t('b2bClients')}</span>
              </div>
              <div className="stat">
                <strong>{stats.delivery}</strong>
                <span>Livraison</span>
              </div>
            </div>
          </div>
          <div className="hero-visual animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="hero-cards">
              <div className="hero-card hero-card-1">
                <div className="hero-card-icon">
                  <CategoryIcons.computers />
                </div>
                <div>
                  <strong>1 200+</strong>
                  <span>Ordinateurs & Portables</span>
                </div>
              </div>
              <div className="hero-card hero-card-2">
                <div className="hero-card-icon">
                  <CategoryIcons.servers />
                </div>
                <div>
                  <strong>800+</strong>
                  <span>Serveurs & Stockage</span>
                </div>
              </div>
              <div className="hero-card hero-card-3">
                <div className="hero-card-icon">
                  <CategoryIcons.networks />
                </div>
                <div>
                  <strong>600+</strong>
                  <span>Réseau & Sécurité</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-scroll-indicator" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </div>
      </section>

      {/* ============ CATEGORIES SECTION ============ */}
      <section className="section section-categories" aria-labelledby="categories-title">
        <div className="container">
          <header className="section-header">
            <div className="section-title">
              <span className="overline">{t('ourCategories')}</span>
              <h2 id="categories-title">{t('ourCategories')}</h2>
              <p>{t('categoriesSub')}</p>
            </div>
            <Link to="/catalogue" className="btn btn-outline">
              Voir tout
              <ArrowRightIcon size={18} />
            </Link>
          </header>

          <div className="categories-carousel" role="list">
            {homeCategories.map((cat) => {
              const IconComponent = CategoryIcons[cat.icon] || CategoryIcons.computers;
              return (
                <Link
                  key={cat.key}
                  to={cat.href}
                  className="category-card"
                  role="listitem"
                >
                  <div className="cat-icon-wrapper">
                    <IconComponent />
                  </div>
                  <h3>{cat.label}</h3>
                  <span className="cat-count">{cat.count} produits</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      {(featuredProducts.length > 0 || newProducts.length > 0) && (
        <section className="section section-products" aria-labelledby="featured-title">
          <div className="container">
            <header className="section-header">
              <div className="section-title">
                <span className="overline">{t('featuredProducts')}</span>
                <h2 id="featured-title">{t('featuredProducts')}</h2>
                <p>{t('featuredSub')}</p>
              </div>
              <Link to="/catalogue" className="btn btn-outline">
                {t('viewAllProducts')}
                <ArrowRightIcon size={18} />
              </Link>
            </header>

            <div className="products-tabs" role="tablist" aria-label="Produits">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'featured'}
                className={`tab-btn ${activeTab === 'featured' ? 'active' : ''}`}
                id="tab-featured"
                onClick={() => setActiveTab('featured')}
              >
                {t('featuredProducts')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'new'}
                className={`tab-btn ${activeTab === 'new' ? 'active' : ''}`}
                id="tab-new"
                onClick={() => setActiveTab('new')}
              >
                {t('new') || 'Nouveautés'}
              </button>
            </div>

            <div
              className="products-grid"
              role="tabpanel"
              aria-labelledby={activeTab === 'new' ? 'tab-new' : 'tab-featured'}
            >
              {displayedProducts.slice(0, 8).map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="default"
                  priority={index < 4}
                />
              ))}
              {displayedProducts.length === 0 && (
                <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                  <p>Aucun produit à afficher pour le moment.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ============ WHY CHOOSE US ============ */}
      <section className="section section-alt section-why-choose" aria-labelledby="why-choose-title">
        <div className="container">
          <header className="section-title">
            <span className="overline">{t('whyChoose')}</span>
            <h2 id="why-choose-title">{t('whyChoose')}</h2>
            <p>{t('whyChooseSub')}</p>
          </header>

          <div className="features-grid">
            {advantages.map((adv, i) => (
              <article key={i} className="feature-card animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="feature-icon" style={{ background: 'rgba(30, 64, 175, 0.1)', color: 'var(--primary)' }}>
                  <adv.icon size={28} />
                </div>
                <h3>{adv.title}</h3>
                <p>{adv.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============ B2B HUB ============ */}
      <section className="section section-b2b" aria-labelledby="b2b-title">
        <div className="container">
          <div className="b2b-card">
            <div className="b2b-content">
              <span className="overline">{t('proHub')}</span>
              <h2 id="b2b-title">{t('proHub')}</h2>
              <p>{t('proHubSub')}</p>
              <ul className="b2b-benefits">
                <li><strong>{t('resellerPrices')}</strong> {t('resellerPricesSub') || 'Accès aux tarifs revendeurs exclusifs'}</li>
                <li><strong>{t('quotes24h')}</strong> {t('quotes24hSub') || 'Devis personnalisés sous 24h'}</li>
                <li><strong>{t('priorityDelivery')}</strong> {t('priorityDeliverySub') || 'Livraison prioritaire gratuite'}</li>
                <li><strong>{t('purchaseManager')}</strong> {t('purchaseManagerSub') || 'Gestion centralisée des achats'}</li>
              </ul>
              <div className="b2b-actions">
                <Link to="/register?type=b2b" className="btn btn-primary btn-lg">
                  {t('createProAccount')}
                  <ArrowRightIcon size={20} />
                </Link>
                <Link to="/espace-pro" className="btn btn-outline btn-lg">
                  {t('b2bPricingGrid')}
                </Link>
              </div>
            </div>
            <div className="b2b-visual" aria-hidden="true">
              <div className="b2b-stats">
                <div className="b2b-stat">
                  <strong>2 000+</strong>
                  <span>Clients B2B actifs</span>
                </div>
                <div className="b2b-stat">
                  <strong>50+</strong>
                  <span>Marques partenaires</span>
                </div>
                <div className="b2b-stat">
                  <strong>98%</strong>
                  <span>Satisfaction client</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ BRANDS BAR ============ */}
      {(
        <section className="section section-brands" aria-labelledby="brands-title">
          <div className="container">
            <header className="section-title">
              <span className="overline">{t('partnerBrands')}</span>
              <h2 id="brands-title">{t('partnerBrands')}</h2>
              <p>Nos partenaires de confiance pour une qualité garantie</p>
            </header>
            <div className="brands-bar" role="list" aria-label="Marques partenaires">
              {[
                'Dell', 'HP', 'Lenovo', 'ASUS', 'MSI', 'Acer', 'Apple', 'Samsung',
                'LG', 'Dell EMC', 'HPE', 'Cisco', 'Ubiquiti', 'MikroTik', 'TP-Link',
                'Synology', 'QNAP', 'Western Digital', 'Seagate', 'Kingston'
              ].map((brand) => (
                <span key={brand} className="brand-logo-item" role="listitem">
                  <span className="brand-logo-text">{brand}</span>
                </span>
              ))}
            </div>
            <div className="text-center mt-32">
              <Link to="/marques" className="btn btn-outline">
                Voir toutes les marques ({brands.length || 16}+)
                <ArrowRightIcon size={18} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ============ NEWSLETTER ============ */}
      <section className="section section-alt section-newsletter" aria-labelledby="newsletter-title">
        <div className="container">
          <div className="newsletter-card">
            <div className="newsletter-content">
              <span className="overline">{t('stayInformed')}</span>
              <h2 id="newsletter-title">{t('stayInformed')}</h2>
              <p>{t('newsletterSub')}</p>
            </div>
            <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
              <div className="newsletter-input-group">
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  className="newsletter-input"
                  aria-label={t('emailPlaceholder')}
                  required
                />
                <button type="submit" className="btn btn-primary newsletter-submit-btn">
                  <span>{t('subscribe')}</span>
                  <ArrowRightIcon size={18} />
                </button>
              </div>
              <p className="newsletter-note">En vous inscrivant, vous acceptez notre <Link to="/confidentialite">politique de confidentialité</Link>. Désinscription en 1 clic.</p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}