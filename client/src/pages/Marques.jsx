// ============================================================
// ERNET STORE — Marques partenaires
// Logos SVG servis depuis /assets/brands/
// ============================================================
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import { brandsApi } from '../api/client.js';
import { brandImage } from '../components/brandImages.js';

const fallbackBrands = [
  { name: 'Intel', count: '320 produits', meta: 'Processeurs, serveurs' },
  { name: 'AMD', count: '280 produits', meta: 'CPU, GPU' },
  { name: 'NVIDIA', count: '150 produits', meta: 'Cartes graphiques' },
  { name: 'ASUS', count: '210 produits', meta: 'Cartes mères, laptops' },
  { name: 'Dell', count: '180 produits', meta: 'PC, serveurs, moniteurs' },
  { name: 'Lenovo', count: '160 produits', meta: 'ThinkPad, ThinkSystem' },
  { name: 'HP', count: '190 produits', meta: 'PC, imprimantes, serveurs' },
  { name: 'Kingston', count: '140 produits', meta: 'RAM, SSD, stockage' },
  { name: 'Seagate', count: '90 produits', meta: 'Disques durs, SSD' },
  { name: 'Corsair', count: '120 produits', meta: 'RAM, PSU, boîtiers' },
  { name: 'Cooler Master', count: '80 produits', meta: 'Ventilation, boîtiers' },
  { name: 'WD', count: '110 produits', meta: 'Stockage, NAS' },
  { name: 'Logitech', count: '75 produits', meta: 'Périphériques' },
  { name: 'MSI', count: '95 produits', meta: 'Cartes mères, laptops' },
  { name: 'Gigabyte', count: '88 produits', meta: 'Cartes mères, GPU' },
  { name: 'TP-Link', count: '70 produits', meta: 'Réseaux, WiFi' },
];

export default function Marques() {
  const { t } = useLanguage();
  const [brands, setBrands] = useState(fallbackBrands);

  useEffect(() => {
    brandsApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((b) => ({
            name: b.name,
            count: `${b.count || 0} produit${(b.count || 0) > 1 ? 's' : ''}`,
            meta: 'Matériel certifié',
          }));
          setBrands(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">{t('home')}</Link> <span className="sep">/</span> <span>{t('brands')}</span>
          </div>
          <h1>
            <span className="gradient-text">{t('brands')}</span>
          </h1>
          <p>{t('heroSubtitle')}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="brands-grid">
            {brands.map((b) => (
              <Link
                to={`/catalogue?brand=${encodeURIComponent(b.name.toLowerCase())}`}
                key={b.name}
                className="brand-card"
              >
                <div className="brand-logo brand-logo-svg">
                  <img src={brandImage(b.name)} alt={`Logo ${b.name}`} className="brand-logo-img" />
                </div>
                <div className="brand-count">{b.count}</div>
                <div className="brand-meta">{b.meta}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
