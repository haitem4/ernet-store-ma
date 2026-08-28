// ============================================================
// ERNET STORE — Promotions
// ============================================================
import { useEffect, useState } from 'react';
import api from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';

export default function Promotions() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/products?onSale=true&limit=12')
      .then((res) => setProducts(res.data.hits || res.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Accueil</a> <span className="sep">/</span> <span>Promotions</span>
          </div>
          <h1>
            <span className="gradient-text">Promotions & Offres Flash</span>
          </h1>
          <p>Les meilleures offres du moment, mises à jour en temps réel.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <p className="text-center">Chargement...</p>
          ) : products.length === 0 ? (
            <p className="text-center">Aucune promotion disponible pour le moment.</p>
          ) : (
            <div className="products-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
