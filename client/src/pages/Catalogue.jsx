// ============================================================
// ERNET STORE — Catalogue Page (Disway-style with filters)
// ============================================================
import { useState, useEffect, useCallback, useMemo, Fragment } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { productsApi, categoriesApi, brandsApi } from '../api/client.js';
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES, FALLBACK_BRANDS } from '../data/fallbackProducts.js';
import ProductCard from '../components/ProductCard.jsx';
import {
  FilterIcon,
  GridIcon,
  ListIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '../components/Icons.jsx';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Pertinence' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'promo', label: 'Promotions' },
];

const PRICE_RANGES = [
  { min: 0, max: 500, label: 'Moins de 500 MAD' },
  { min: 500, max: 2000, label: '500 - 2 000 MAD' },
  { min: 2000, max: 5000, label: '2 000 - 5 000 MAD' },
  { min: 5000, max: 10000, label: '5 000 - 10 000 MAD' },
  { min: 10000, max: null, label: 'Plus de 10 000 MAD' },
];

export default function Catalogue() {
  const { t, lang } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    category: true,
    brand: false,
    price: false,
    availability: false,
  });
  const [brandSearch, setBrandSearch] = useState('');

  // Filter brands based on search
  const filteredBrands = useMemo(() => {
    const list = brands.length ? brands : FALLBACK_BRANDS;
    if (!brandSearch) return list;
    return list.filter(b =>
      b.name.toLowerCase().includes(brandSearch.toLowerCase())
    );
  }, [brands, brandSearch]);

  // Parse URL params
  const params = useMemo(() => ({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    inStock: searchParams.get('inStock') === 'true',
    sort: searchParams.get('sort') || 'relevance',
    page: parseInt(searchParams.get('page') || '1'),
  }), [searchParams]);

  // Client-side fallback filtering when API is offline / slow
  const getFilteredFallback = useCallback(() => {
    let list = [...FALLBACK_PRODUCTS];
    if (params.q) {
      const qLower = params.q.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(qLower) || (p.brand?.name || p.brand || '').toLowerCase().includes(qLower));
    }
    if (params.category) {
      const catLower = params.category.toLowerCase();
      list = list.filter(p => (p.category?.slug || p.category || '').toLowerCase() === catLower || (p.category?.name || p.category || '').toLowerCase().includes(catLower));
    }
    if (params.brand) {
      const brandLower = params.brand.toLowerCase();
      list = list.filter(p => (p.brand?.slug || p.brand?.name || p.brand || '').toLowerCase() === brandLower);
    }
    if (params.minPrice) {
      list = list.filter(p => p.price >= Number(params.minPrice));
    }
    if (params.maxPrice) {
      list = list.filter(p => p.price <= Number(params.maxPrice));
    }
    if (params.inStock) {
      list = list.filter(p => p.stock > 0);
    }
    if (params.sort === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (params.sort === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (params.sort === 'newest') {
      list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
    }
    return list;
  }, [params]);

  // Fetch data with instantaneous fallback
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const apiParams = {
        q: params.q || undefined,
        category: params.category || undefined,
        brand: params.brand || undefined,
        minPrice: params.minPrice || undefined,
        maxPrice: params.maxPrice || undefined,
        inStock: params.inStock || undefined,
        sort: params.sort,
        page: params.page,
        limit: 24,
      };

      const [productsRes, catsRes, brandsRes] = await Promise.all([
        productsApi.list(apiParams).catch(() => null),
        categories.length ? Promise.resolve(categories) : categoriesApi.list().catch(() => null),
        brands.length ? Promise.resolve(brands) : brandsApi.list().catch(() => null),
      ]);

      const hits = productsRes?.data?.hits || productsRes?.data?.products || [];
      if (hits.length > 0) {
        setProducts(hits);
        setTotalCount(productsRes.data.total || hits.length);
      } else {
        const fallbackList = getFilteredFallback();
        setProducts(fallbackList);
        setTotalCount(fallbackList.length);
      }

      setCategories(catsRes && catsRes.length ? catsRes : FALLBACK_CATEGORIES);
      setBrands(brandsRes && brandsRes.length ? brandsRes : FALLBACK_BRANDS);
    } catch (err) {
      console.warn('Using fast fallback catalogue:', err.message);
      const fallbackList = getFilteredFallback();
      setProducts(fallbackList);
      setTotalCount(fallbackList.length);
      if (!categories.length) setCategories(FALLBACK_CATEGORIES);
      if (!brands.length) setBrands(FALLBACK_BRANDS);
    } finally {
      setLoading(false);
    }
  }, [params, categories, brands, getFilteredFallback]);

  useEffect(() => {
    fetchData();
    setCurrentPage(params.page);
  }, [fetchData, params.page]);

  // Update URL params
  const updateParams = (newParams, replace = false) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === '' || value === null || value === undefined) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    nextParams.set('page', '1');
    setSearchParams(nextParams, { replace });
  };

  const handleSortChange = (sort) => {
    updateParams({ sort });
  };

  const handleCategoryChange = (category) => {
    updateParams({ category: category || '' });
  };

  const handleBrandChange = (brand) => {
    updateParams({ brand: brand || '' });
  };

  const handlePriceRangeChange = (range) => {
    if (range) {
      updateParams({ minPrice: range.min, maxPrice: range.max || '' });
    } else {
      updateParams({ minPrice: '', maxPrice: '' });
    }
  };

  const handleStockChange = (inStock) => {
    updateParams({ inStock: inStock ? 'true' : '' });
  };

  const clearFilters = () => {
    updateParams({
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      inStock: '',
    });
  };

  const hasActiveFilters = params.category || params.brand || params.minPrice || params.maxPrice || params.inStock;

  // Format price
  const formatPrice = (price) => {
    if (!price) return '—';
    return new Intl.NumberFormat(lang === 'fr' ? 'fr-MA' : 'en-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const totalPages = Math.ceil(totalCount / 24);

  if (loading && products.length === 0) {
    return (
      <div className="page-catalogue loading">
        <div className="catalogue-header-skeleton">
          <div className="skeleton skeleton-text" style={{ width: '40%' }} />
          <div className="skeleton skeleton-text" style={{ width: '60%', marginTop: '8px' }} />
        </div>
        <div className="catalogue-body-skeleton">
          <div className="skeleton skeleton-sidebar" />
          <div className="skeleton-grid">
            {[...Array(8)].map((_, i) => <div key={i} className="skeleton skeleton-product" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-catalogue">
      {/* Page Header */}
      <header className="catalogue-header">
        <div className="container">
          <div className="catalogue-header-content">
            <div className="catalogue-title">
              <span className="overline">{t('catalogTitle')}</span>
              <h1>{t('catalogTitle')}</h1>
              <p>{t('catalogSub')}</p>
            </div>
            <div className="catalogue-results">
              <span className="results-count">
                {totalCount.toLocaleString()} {t('productsFound')}
              </span>
              {params.q && (
                <span className="search-query">
                  « {params.q} »
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Filters & Results */}
      <div className="catalogue-body">
        <div className="container">
          <div className="catalogue-grid">
            {/* Sidebar Filters */}
            <aside className={`catalogue-sidebar ${filtersOpen ? 'open' : ''}`} aria-label="Filtres">
              <div className="sidebar-header">
                <h2>
                  <FilterIcon size={20} />
                  {t('filters')}
                </h2>
                {hasActiveFilters && (
                  <button className="btn btn-sm btn-outline clear-filters" onClick={clearFilters}>
                    Effacer les filtres
                  </button>
                )}
              </div>

              <div className="sidebar-content">
                {/* Search within results */}
                {params.q && (
                  <div className="filter-group">
                    <label className="filter-label">Affiner la recherche</label>
                    <input
                      type="text"
                      placeholder="Mots-clés supplémentaires..."
                      className="filter-input"
                      defaultValue={params.q}
                      onChange={(e) => updateParams({ q: e.target.value })}
                    />
                  </div>
                )}

                {/* Category Filter */}
                <FilterGroup
                  title={t('category')}
                  expanded={expandedFilters.category}
                  onToggle={() => setExpandedFilters(p => ({ ...p, category: !p.category }))}
                >
                  <ul className="filter-options">
                    <li>
                      <label className="filter-checkbox">
                        <input
                          type="radio"
                          name="category"
                          checked={!params.category}
                          onChange={() => handleCategoryChange('')}
                        />
                        <span>{t('all')}</span>
                      </label>
                    </li>
                    {categories.slice(0, 15).map((cat) => (
                      <li key={cat.slug}>
                        <label className="filter-checkbox">
                          <input
                            type="radio"
                            name="category"
                            checked={params.category === cat.slug}
                            onChange={() => handleCategoryChange(cat.slug)}
                          />
                          <span>{cat.name}</span>
                          <span className="filter-count">({cat.count || 0})</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </FilterGroup>

                {/* Brand Filter */}
                <FilterGroup
                  title={t('brand')}
                  expanded={expandedFilters.brand}
                  onToggle={() => setExpandedFilters(p => ({ ...p, brand: !p.brand }))}
                >
                  <div className="filter-search">
                    <input
                      type="text"
                      placeholder="Rechercher une marque..."
                      className="filter-input"
                      value={brandSearch}
                      onChange={(e) => setBrandSearch(e.target.value)}
                    />
                  </div>
                  <ul className="filter-options">
                    {filteredBrands.map((brand) => (
                      <li key={brand.slug}>
                        <label className="filter-checkbox">
                          <input
                            type="checkbox"
                            checked={params.brand === brand.slug}
                            onChange={() => handleBrandChange(params.brand === brand.slug ? '' : brand.slug)}
                          />
                          <span>{brand.name}</span>
                          <span className="filter-count">({brand.count || 0})</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </FilterGroup>

                {/* Price Filter */}
                <FilterGroup
                  title={t('price')}
                  expanded={expandedFilters.price}
                  onToggle={() => setExpandedFilters(p => ({ ...p, price: !p.price }))}
                >
                  <ul className="filter-options">
                    <li>
                      <label className="filter-radio">
                        <input
                          type="radio"
                          name="price"
                          checked={!params.minPrice && !params.maxPrice}
                          onChange={() => handlePriceRangeChange(null)}
                        />
                        <span>{t('all')}</span>
                      </label>
                    </li>
                    {PRICE_RANGES.map((range) => (
                      <li key={`${range.min}-${range.max}`}>
                        <label className="filter-radio">
                          <input
                            type="radio"
                            name="price"
                            checked={params.minPrice == range.min && params.maxPrice == (range.max || '')}
                            onChange={() => handlePriceRangeChange(range)}
                          />
                          <span>{range.label}</span>
                        </label>
                      </li>
                    ))}
                    <li>
                      <div className="custom-price-range">
                        <input
                          type="number"
                          placeholder="Min"
                          value={params.minPrice}
                          onChange={(e) => updateParams({ minPrice: e.target.value || '' })}
                          className="filter-input filter-input-sm"
                        />
                        <span>–</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={params.maxPrice}
                          onChange={(e) => updateParams({ maxPrice: e.target.value || '' })}
                          className="filter-input filter-input-sm"
                        />
                      </div>
                    </li>
                  </ul>
                </FilterGroup>

                {/* Availability Filter */}
                <FilterGroup
                  title={t('availability')}
                  expanded={expandedFilters.availability}
                  onToggle={() => setExpandedFilters(p => ({ ...p, availability: !p.availability }))}
                >
                  <ul className="filter-options">
                    <li>
                      <label className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={params.inStock}
                          onChange={(e) => handleStockChange(e.target.checked)}
                        />
                        <span>En stock uniquement</span>
                      </label>
                    </li>
                    <li>
                      <label className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => {}}
                          disabled
                        />
                        <span>{t('onOrder')} (bientôt)</span>
                      </label>
                    </li>
                  </ul>
                </FilterGroup>
              </div>
            </aside>

            {/* Main Results */}
            <div className="catalogue-main">
              {/* Toolbar */}
              <div className="catalogue-toolbar">
                <div className="toolbar-left">
                  <label className="toolbar-sort" htmlFor="sort-select">
                    <span className="toolbar-label">{t('sortRelevance').replace('Trier : ', '')}</span>
                    <select
                      id="sort-select"
                      value={params.sort}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="toolbar-select"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="toolbar-right">
                  <div className="view-toggle" role="group" aria-label="Mode d'affichage">
                    <button
                      className={viewMode === 'grid' ? 'active' : ''}
                      onClick={() => setViewMode('grid')}
                      aria-label="Vue grille"
                      aria-pressed={viewMode === 'grid'}
                    >
                      <GridIcon size={20} />
                    </button>
                    <button
                      className={viewMode === 'list' ? 'active' : ''}
                      onClick={() => setViewMode('list')}
                      aria-label="Vue liste"
                      aria-pressed={viewMode === 'list'}
                    >
                      <ListIcon size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Mobile Filters Toggle */}
              <button
                className="mobile-filters-toggle"
                onClick={() => setFiltersOpen(!filtersOpen)}
                aria-expanded={filtersOpen}
              >
                <FilterIcon size={20} />
                <span>{t('filters')}</span>
                {hasActiveFilters && <span className="filter-badge">!</span>}
              </button>

              {/* Products Grid */}
              <div className={`products-grid ${viewMode}`} role="list">
                {products.length > 0 ? (
                  products.map((product, index) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={viewMode === 'list' ? 'compact' : 'default'}
                      priority={index < 4}
                    />
                  ))
                ) : (
                  <div className="no-results" role="status">
                    <div className="no-results-icon">
                      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="11" cy="11" r="7" />
                        <path d="M16 16l5 5" />
                      </svg>
                    </div>
                    <h3>Aucun produit trouvé</h3>
                    <p>Essayez de modifier vos filtres ou votre recherche</p>
                    {hasActiveFilters && (
                      <button className="btn btn-primary" onClick={clearFilters}>
                        Effacer tous les filtres
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="catalogue-pagination" aria-label="Pagination">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => updateParams({ page: currentPage - 1 })}
                    disabled={currentPage <= 1}
                    aria-label="Page précédente"
                  >
                    <ChevronDownIcon size={18} />
                    <span>{t('previous')}</span>
                  </button>
                  <div className="pagination-pages">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page =>
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, i, arr) => (
                        <Fragment key={page}>
                          {i > 0 && arr[i - 1] !== page - 1 && (
                            <span className="pagination-ellipsis">…</span>
                          )}
                          <button
                            className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                            onClick={() => updateParams({ page })}
                            aria-label={`Page ${page}`}
                            aria-current={currentPage === page ? 'page' : undefined}
                          >
                            {page}
                          </button>
                        </Fragment>
                      ))}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => updateParams({ page: currentPage + 1 })}
                    disabled={currentPage >= totalPages}
                    aria-label="Page suivante"
                  >
                    <span>{t('next')}</span>
                    <ChevronUpIcon size={18} />
                  </button>
                </nav>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Filters Overlay */}
      {filtersOpen && (
        <div className="mobile-filters-overlay" onClick={() => setFiltersOpen(false)}>
          <aside className="mobile-filters-panel" onClick={e => e.stopPropagation()}>
            <div className="mobile-filters-header">
              <h2>{t('filters')}</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label="Fermer">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mobile-filters-content">
              {/* Filters content would go here - simplified for mobile */}
              <p style={{ padding: '20px', color: 'var(--text-light)' }}>
                Les filtres sont disponibles en version desktop. Utilisez la recherche et le tri ci-dessus.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// Helper components
function FilterGroup({ title, expanded, onToggle, children }) {
  return (
    <div className="filter-group">
      <button
        className="filter-group-header"
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <span>{title}</span>
        {expanded ? <ChevronUpIcon size={18} /> : <ChevronDownIcon size={18} />}
      </button>
      {expanded && <div className="filter-group-content">{children}</div>}
    </div>
  );
}