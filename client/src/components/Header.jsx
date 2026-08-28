// ============================================================
// ERNET STORE — Header & Navigation Haute Performance (B2B & B2C)
// ============================================================
import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Logo from './Logo.jsx';
import {
  SearchIcon,
  MenuIcon,
  CloseIcon,
  UserIcon,
  CartIcon,
  HeartIcon,
  ChevronDownIcon,
  TruckIcon,
  ShieldIcon,
  HeadphonesIcon,
  TagIcon,
  GlobeIcon,
  ClockIcon,
  SettingsIcon,
  LogoutIcon,
  WhatsAppIcon,
} from './Icons.jsx';

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const { user, logout, isB2B, isAdmin, isAuthenticated } = useAuth();
  const { count: cartCount, total: cartTotal } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const headerRef = useRef(null);
  const userMenuRef = useRef(null);
  const megaMenuRef = useRef(null);

  // Détection du scroll fluide (sans layout-shift / vibration)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fermeture des menus au changement de page
  useEffect(() => {
    setMenuOpen(false);
    setMegaOpen(false);
    setUserMenuOpen(false);
    setSearchFocused(false);
  }, [location.pathname, location.search]);

  // Clic en dehors pour fermer les dropdowns
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target)) {
        setMegaOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim() || searchCategory) {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (searchCategory) params.set('category', searchCategory);
      navigate(`/catalogue?${params.toString()}`);
      setSearchFocused(false);
    }
  };

  const megaMenuCategories = [
    {
      title: '🖥️ Serveurs & Data Center',
      categorySlug: 'serveurs',
      items: [
        { label: 'Serveurs Rack', slug: 'serveurs' },
        { label: 'Serveurs Tour', slug: 'serveurs' },
        { label: 'Baies & Racks 19"', slug: 'rack-pdu' },
        { label: 'Stockage SAN / NAS', slug: 'stockage' },
        { label: 'Onduleurs & PDU', slug: 'rack-pdu' },
      ],
    },
    {
      title: '💻 PC, Portables & Stations',
      categorySlug: 'pc-portables',
      items: [
        { label: 'PC Portables Professionnels', slug: 'pc-portables' },
        { label: 'Stations de Travail (Workstation)', slug: 'stations-travail' },
        { label: 'Ordinateurs de Bureau (Desktop)', slug: 'pc-bureau' },
        { label: 'Tablettes & Terminaux', slug: 'tablettes' },
        { label: 'Écrans & Moniteurs Pro', slug: 'moniteurs' },
      ],
    },
    {
      title: '🌐 Réseaux & Télécoms',
      categorySlug: 'reseaux',
      items: [
        { label: 'Switches Manageables', slug: 'switches' },
        { label: 'Routeurs & Passerelles', slug: 'routeurs' },
        { label: 'Bornes Wi-Fi Professionnelles', slug: 'points-acces' },
        { label: 'Firewalls & Sécurité Réseau', slug: 'securite-reseau' },
        { label: 'Câblage & Fibre Optique', slug: 'reseaux' },
      ],
    },
    {
      title: '💾 Composants & Périphériques',
      categorySlug: 'accessoires',
      items: [
        { label: 'Disques SSD NVMe / SATA', slug: 'stockage' },
        { label: 'Mémoires RAM Serveur & PC', slug: 'accessoires' },
        { label: 'Imprimantes & Scanners', slug: 'imprimantes' },
        { label: 'Accessoires & Câbles', slug: 'accessoires' },
        { label: 'Licences & Logiciels', slug: 'logiciels' },
      ],
    },
  ];

  const popularSearches = [
    'Serveur Dell PowerEdge',
    'HP ProLiant',
    'ThinkPad Lenovo',
    'Switch Cisco',
    'SSD Kingston',
    'Fortinet FortiGate',
    'Écran ASUS',
    'Imprimante HP LaserJet',
  ];

  return (
    <>
      {/* ============ 1. TOP BAR CORPORATE ============ */}
      <div className="ernet-topbar">
        <div className="container topbar-inner">
          <div className="topbar-left">
            <span className="topbar-badge">DISTRIBUTEUR IT OFFICIEL</span>
            <span className="topbar-info">
              <GlobeIcon size={14} />
              Casablanca, Maroc
            </span>
            <span className="topbar-sep">•</span>
            <a href="tel:+212522204060" className="topbar-link">
              <HeadphonesIcon size={14} />
              Support Ventes : <strong>+212 5 22 20 40 60</strong>
            </a>
          </div>

          <div className="topbar-right">
            <Link to="/espace-pro" className="topbar-pro-cta">
              <TagIcon size={13} />
              <span>Devis Express B2B</span>
            </Link>

            <span className="topbar-sep">•</span>

            {/* Switcher Langue */}
            <div className="topbar-lang" role="group" aria-label="Langue">
              <button
                className={`topbar-lang-btn ${lang === 'fr' ? 'active' : ''}`}
                onClick={() => setLang('fr')}
              >
                FR
              </button>
              <button
                className={`topbar-lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>

            <span className="topbar-currency">MAD (DH)</span>
          </div>
        </div>
      </div>

      {/* ============ 2. MAIN HEADER (Sticky & Smooth) ============ */}
      <header
        className={`ernet-main-header ${scrolled ? 'is-scrolled' : ''}`}
        ref={headerRef}
      >
        <div className="container header-content">
          {/* Logo Principal avec Tagline */}
          <Link to="/" className="header-brand-link" aria-label="ERNET STORE Accueil">
            <Logo size="lg" withText={true} />
          </Link>

          {/* Switcher Langue pour Mobile (FR / EN) */}
          <div className="header-mobile-lang" role="group" aria-label="Langue">
            <button
              className={`topbar-lang-btn ${lang === 'fr' ? 'active' : ''}`}
              onClick={() => setLang('fr')}
            >
              FR
            </button>
            <button
              className={`topbar-lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>

          {/* Barre de Recherche Intelligente */}
          <div className="header-search-container">
            <form onSubmit={handleSearch} className="header-search-form" role="search">
              {/* Sélecteur de rayon intégré */}
              <div className="search-category-select">
                <select
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                  aria-label="Catégorie de recherche"
                >
                  <option value="">Tous les rayons</option>
                  <option value="serveurs">Serveurs & Baies</option>
                  <option value="pc-portables">PC & Portables</option>
                  <option value="reseaux">Réseaux & Wi-Fi</option>
                  <option value="stockage">Stockage & SSD</option>
                  <option value="imprimantes">Impression</option>
                  <option value="accessoires">Accessoires</option>
                </select>
                <ChevronDownIcon size={14} className="select-chevron" />
              </div>

              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Rechercher une référence, produit, marque (ex: Serveur HP, Switch Cisco...)"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  className="search-main-input"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setQuery('')}
                    aria-label="Effacer"
                  >
                    ×
                  </button>
                )}
              </div>

              <button type="submit" className="search-submit-btn" aria-label="Lancer la recherche">
                <SearchIcon size={18} />
                <span className="search-btn-label">Rechercher</span>
              </button>
            </form>

            {/* Suggestions de recherche au focus */}
            {searchFocused && (
              <div
                className="search-popover"
                onMouseDown={(e) => e.preventDefault()} // évite le blur prématuré
              >
                <div className="popover-section">
                  <span className="popover-title">🔥 Recherches fréquentes :</span>
                  <div className="popover-tags">
                    {popularSearches.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        className="popover-tag"
                        onClick={() => {
                          setQuery(s);
                          navigate(`/catalogue?q=${encodeURIComponent(s)}`);
                          setSearchFocused(false);
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="popover-footer">
                  <span>Appuyez sur Entrée pour valider la recherche</span>
                  <Link
                    to="/catalogue"
                    className="popover-link-all"
                    onClick={() => setSearchFocused(false)}
                  >
                    Voir tout le catalogue →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Action Hub (Devis, Favoris, Compte, Panier) */}
          <div className="header-actions-hub">
            {/* Bouton Devis Express B2B */}
            <Link to="/espace-pro" className="header-action-pill b2b-pill">
              <TagIcon size={18} />
              <div className="pill-text">
                <span className="pill-caption">Professionnels</span>
                <span className="pill-strong">Devis B2B</span>
              </div>
            </Link>

            {/* Favoris */}
            <Link
              to="/compte"
              className="header-action-icon-btn"
              title="Mes favoris"
              aria-label="Favoris"
            >
              <HeartIcon size={22} />
              <span className="action-icon-label">Favoris</span>
            </Link>

            {/* Espace Compte / Profil */}
            <div className="header-dropdown-container" ref={userMenuRef}>
              <button
                className="header-action-pill user-pill"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                aria-expanded={userMenuOpen}
                aria-haspopup="true"
              >
                <div className="user-icon-avatar">
                  {isAuthenticated ? (
                    <span>{user?.firstName?.[0]?.toUpperCase() || 'U'}</span>
                  ) : (
                    <UserIcon size={20} />
                  )}
                </div>
                <div className="pill-text">
                  <span className="pill-caption">
                    {isAuthenticated
                      ? user?.companyName || (isB2B ? 'Compte Pro' : 'Mon compte')
                      : 'Espace client'}
                  </span>
                  <span className="pill-strong">
                    {isAuthenticated ? user?.firstName : 'Se connecter'}
                  </span>
                </div>
                <ChevronDownIcon size={14} className="pill-chevron" />
              </button>

              {/* Menu Profil Déroulant */}
              {userMenuOpen && (
                <div className="ernet-dropdown-panel user-dropdown-panel" role="menu">
                  {isAuthenticated ? (
                    <>
                      <div className="user-panel-header">
                        <div className="user-avatar-lg">
                          {user?.firstName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-panel-details">
                          <strong>
                            {user?.firstName} {user?.lastName}
                          </strong>
                          <span className="user-email">{user?.email}</span>
                          <div className="user-tags">
                            {isB2B && <span className="badge-pill b2b">Client B2B</span>}
                            {isAdmin && <span className="badge-pill admin">Administrateur</span>}
                          </div>
                        </div>
                      </div>

                      <div className="user-panel-links">
                        <Link
                          to="/compte"
                          className="user-panel-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <UserIcon size={18} />
                          <span>Tableau de bord</span>
                        </Link>
                        <Link
                          to="/compte"
                          className="user-panel-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <TruckIcon size={18} />
                          <span>Mes commandes</span>
                        </Link>
                        <Link
                          to="/compte"
                          className="user-panel-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <TagIcon size={18} />
                          <span>Mes devis en ligne</span>
                        </Link>
                        <Link
                          to="/compte"
                          className="user-panel-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <HeartIcon size={18} />
                          <span>Mes favoris</span>
                        </Link>
                        {isAdmin && (
                          <Link
                            to="/admin/orders"
                            className="user-panel-item admin-item"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <SettingsIcon size={18} />
                            <span>Panneau d'administration</span>
                          </Link>
                        )}
                      </div>

                      <div className="user-panel-footer">
                        <button
                          type="button"
                          className="logout-btn"
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                        >
                          <LogoutIcon size={18} />
                          <span>Déconnexion</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="guest-panel">
                      <h4>Bienvenue sur ERNET STORE</h4>
                      <p>Connectez-vous pour consulter vos tarifs remisés et passer commande.</p>
                      <div className="guest-actions">
                        <Link
                          to="/login"
                          className="btn btn-primary btn-sm btn-full"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Connexion
                        </Link>
                        <Link
                          to="/register"
                          className="btn btn-outline btn-sm btn-full"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Créer un compte
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panier */}
            <Link
              to="/panier"
              className="header-action-pill cart-pill"
              aria-label={`Panier (${cartCount} articles)`}
            >
              <div className="cart-icon-wrap">
                <CartIcon size={22} />
                <span className="cart-count-bubble">{cartCount}</span>
              </div>
              <div className="pill-text cart-pill-text">
                <span className="pill-caption">Panier</span>
                <span className="pill-strong">
                  {cartTotal ? `${Number(cartTotal).toLocaleString('fr-FR')} DH` : '0 DH'}
                </span>
              </div>
            </Link>

            {/* Toggle Menu Mobile */}
            <button
              className="mobile-toggle-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? 'Fermer menu' : 'Ouvrir menu'}
            >
              {menuOpen ? <CloseIcon size={26} /> : <MenuIcon size={26} />}
            </button>
          </div>
        </div>

        {/* ============ 3. NAVIGATION BAR & RAYONS ============ */}
        <nav className="ernet-navbar" aria-label="Navigation principale">
          <div className="container navbar-inner">
            {/* Bouton Rayons & Mega Menu Dropdown */}
            <div className="mega-menu-trigger-wrap" ref={megaMenuRef}>
              <button
                className={`mega-menu-btn ${megaOpen ? 'active' : ''}`}
                onClick={() => setMegaOpen(!megaOpen)}
                aria-expanded={megaOpen}
              >
                <MenuIcon size={18} />
                <span>Tous nos Rayons</span>
                <ChevronDownIcon size={16} className={`chevron-rot ${megaOpen ? 'open' : ''}`} />
              </button>

              {/* Mega Menu Dropdown Panel */}
              {megaOpen && (
                <div className="mega-dropdown-panel" role="menu">
                  <div className="mega-dropdown-grid">
                    {megaMenuCategories.map((cat, i) => (
                      <div key={i} className="mega-category-col">
                        <Link
                          to={`/catalogue?category=${cat.categorySlug}`}
                          className="mega-category-head"
                          onClick={() => setMegaOpen(false)}
                        >
                          {cat.title}
                        </Link>
                        <ul className="mega-category-links">
                          {cat.items.map((sub, j) => (
                            <li key={j}>
                              <Link
                                to={`/catalogue?category=${sub.slug}`}
                                onClick={() => setMegaOpen(false)}
                              >
                                {sub.label}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Bloc Promo / B2B dans Mega Menu */}
                    <div className="mega-highlight-col">
                      <div className="mega-promo-box">
                        <span className="promo-badge-hot">B2B EXPRESS</span>
                        <h4>Besoin d'un parc informatique ?</h4>
                        <p>Nos conseillers évaluent vos besoins et vous répondent sous 2 heures.</p>
                        <Link
                          to="/espace-pro"
                          className="btn btn-sm btn-light"
                          onClick={() => setMegaOpen(false)}
                        >
                          Demander un Devis →
                        </Link>
                      </div>
                    </div>
                  </div>

                  <div className="mega-dropdown-footer">
                    <div className="mega-footer-brands">
                      <span>Marques certifiées :</span>
                      <strong>DELL • HP • LENOVO • CISCO • ASUS • KINGSTON • SEAGATE • APC</strong>
                    </div>
                    <Link
                      to="/catalogue"
                      className="mega-view-all"
                      onClick={() => setMegaOpen(false)}
                    >
                      Explorer tous les produits ({'>'}3000 références) →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Liens de navigation horizontaux */}
            <ul className="navbar-links-list">
              <li>
                <NavLink to="/catalogue" className="nav-item-link" end>
                  Catalogue Complet
                </NavLink>
              </li>
              <li>
                <NavLink to="/catalogue?category=serveurs" className="nav-item-link">
                  Serveurs & Baies
                </NavLink>
              </li>
              <li>
                <NavLink to="/catalogue?category=pc-portables" className="nav-item-link">
                  PC & Laptops
                </NavLink>
              </li>
              <li>
                <NavLink to="/catalogue?category=reseaux" className="nav-item-link">
                  Réseaux & Sécurité
                </NavLink>
              </li>
              <li>
                <NavLink to="/marques" className="nav-item-link">
                  Marques
                </NavLink>
              </li>
              <li>
                <NavLink to="/promotions" className="nav-item-link nav-item-promo">
                  <span className="promo-dot"></span>
                  Promotions
                </NavLink>
              </li>
              <li>
                <NavLink to="/espace-pro" className="nav-item-link nav-item-b2b">
                  Espace Pro B2B
                </NavLink>
              </li>
            </ul>

            {/* Raccourci Hotline Droite */}
            <div className="navbar-quick-contact">
              <a
                href="https://wa.me/212600000000"
                target="_blank"
                rel="noreferrer"
                className="whatsapp-quick-link"
                title="Contactez notre équipe sur WhatsApp"
              >
                <WhatsAppIcon size={16} />
                <span>WhatsApp Pro</span>
              </a>
            </div>
          </div>
        </nav>
      </header>

      {/* ============ 4. MOBILE MENU DRAWER ============ */}
      <div
        className={`mobile-drawer-backdrop ${menuOpen ? 'is-active' : ''}`}
        onClick={() => setMenuOpen(false)}
      >
        <div className="mobile-drawer-content" onClick={(e) => e.stopPropagation()}>
          <div className="mobile-drawer-header">
            <Logo size="md" withText={true} />
            <button
              className="drawer-close-btn"
              onClick={() => setMenuOpen(false)}
              aria-label="Fermer"
            >
              <CloseIcon size={24} />
            </button>
          </div>

          <div className="mobile-drawer-search">
            <form onSubmit={handleSearch} className="header-search-form">
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="search-main-input"
              />
              <button type="submit" className="search-submit-btn">
                <SearchIcon size={18} />
              </button>
            </form>
          </div>

          <div className="mobile-drawer-nav">
            <div className="drawer-section-title">RAYONS & PRODUITS</div>
            {megaMenuCategories.map((cat, i) => (
              <div key={i} className="drawer-accordion-item">
                <Link
                  to={`/catalogue?category=${cat.categorySlug}`}
                  className="drawer-cat-main"
                  onClick={() => setMenuOpen(false)}
                >
                  {cat.title}
                </Link>
                <div className="drawer-sublinks">
                  {cat.items.map((sub, j) => (
                    <Link
                      key={j}
                      to={`/catalogue?category=${sub.slug}`}
                      className="drawer-sublink"
                      onClick={() => setMenuOpen(false)}
                    >
                      {sub.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            <div className="drawer-section-title">ACCÈS DIRECT</div>
            <Link to="/catalogue" className="drawer-direct-link" onClick={() => setMenuOpen(false)}>
              📦 Tout le Catalogue
            </Link>
            <Link to="/marques" className="drawer-direct-link" onClick={() => setMenuOpen(false)}>
              🏷️ Marques Partenaires
            </Link>
            <Link
              to="/promotions"
              className="drawer-direct-link promo-text"
              onClick={() => setMenuOpen(false)}
            >
              🔥 Promotions & Déstockage
            </Link>
            <Link
              to="/espace-pro"
              className="drawer-direct-link pro-text"
              onClick={() => setMenuOpen(false)}
            >
              💼 Espace Professionnel (Devis B2B)
            </Link>
          </div>

          <div className="mobile-drawer-footer">
            {isAuthenticated ? (
              <div className="drawer-user-box">
                <strong>
                  {user?.firstName} {user?.lastName}
                </strong>
                <p>{user?.email}</p>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <Link
                    to="/compte"
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => setMenuOpen(false)}
                  >
                    Mon compte
                  </Link>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                  >
                    Quitter
                  </button>
                </div>
              </div>
            ) : (
              <div className="drawer-auth-box">
                <Link
                  to="/login"
                  className="btn btn-primary btn-sm btn-full"
                  onClick={() => setMenuOpen(false)}
                >
                  Se connecter
                </Link>
                <Link
                  to="/register"
                  className="btn btn-outline btn-sm btn-full"
                  onClick={() => setMenuOpen(false)}
                  style={{ marginTop: 8 }}
                >
                  Créer un compte
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============ 5. VALUE PROPOSITION STRIP ============ */}
      <div className="ernet-trust-strip">
        <div className="container trust-strip-inner">
          <div className="trust-cell">
            <div className="trust-icon-box">
              <TruckIcon size={20} />
            </div>
            <div className="trust-texts">
              <strong>Livraison Express 24-48h</strong>
              <span>Casablanca & tout le Maroc</span>
            </div>
          </div>

          <div className="trust-cell">
            <div className="trust-icon-box">
              <ShieldIcon size={20} />
            </div>
            <div className="trust-texts">
              <strong>Garantie Constructeur</strong>
              <span>Produits neufs & certifiés</span>
            </div>
          </div>

          <div className="trust-cell">
            <div className="trust-icon-box">
              <TagIcon size={20} />
            </div>
            <div className="trust-texts">
              <strong>Tarifs Dégressifs B2B</strong>
              <span>Comptes pro & revendeurs</span>
            </div>
          </div>

          <div className="trust-cell">
            <div className="trust-icon-box">
              <HeadphonesIcon size={20} />
            </div>
            <div className="trust-texts">
              <strong>Assistance Technique</strong>
              <span>Experts serveurs & réseaux</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ 6. MOBILE BOTTOM NAVIGATION BAR ============ */}
      <nav className="mobile-bottom-nav" aria-label="Navigation rapide mobile">
        <NavLink
          to="/"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <span className="bottom-nav-icon">🏠</span>
          <span className="bottom-nav-label">Accueil</span>
        </NavLink>

        <button
          type="button"
          className={`bottom-nav-item ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Ouvrir les rayons"
        >
          <MenuIcon size={20} />
          <span className="bottom-nav-label">Rayons</span>
        </button>

        <NavLink
          to="/espace-pro"
          className={({ isActive }) => `bottom-nav-item b2b ${isActive ? 'active' : ''}`}
        >
          <TagIcon size={20} />
          <span className="bottom-nav-label">Devis B2B</span>
        </NavLink>

        <NavLink
          to="/panier"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <div className="bottom-nav-badge-wrap">
            <CartIcon size={20} />
            {cartCount > 0 && <span className="bottom-cart-badge">{cartCount}</span>}
          </div>
          <span className="bottom-nav-label">Panier</span>
        </NavLink>

        <NavLink
          to={isAuthenticated ? '/compte' : '/login'}
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <UserIcon size={20} />
          <span className="bottom-nav-label">{isAuthenticated ? 'Compte' : 'Connexion'}</span>
        </NavLink>
      </nav>
    </>
  );
}