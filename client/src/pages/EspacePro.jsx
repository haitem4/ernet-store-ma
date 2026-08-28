// ============================================================
// ERNET STORE — Espace Revendeurs & Professionnels (B2B)
// ============================================================
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const tiers = [
  ['Intel Core i7-14700K', '4 590 DH'],
  ['RTX 4070 Super 12 Go', '6 990 DH'],
  ['Dell Latitude 5540', '8 490 DH'],
  ['DDR5 32 Go Kingston', '1 190 DH'],
  ['Serveur Dell PowerEdge T360', '12 500 DH'],
];

export default function EspacePro() {
  const { user } = useAuth();
  const isLoggedIn = !!user;

  return (
    <>
      <section
        className="page-hero"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: '#fff' }}
      >
        <div className="container">
          <div className="breadcrumb">
            <a href="/" style={{ color: 'var(--primary)' }}>
              Accueil
            </a>{' '}
            <span className="sep" style={{ color: 'rgba(255,255,255,0.4)' }}>
              /
            </span>{' '}
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Espace Pro</span>
          </div>
          <span className="overline" style={{ color: 'var(--primary)' }}>
            B2B
          </span>
          <h1 style={{ color: '#fff' }}>
            Espace <span className="gradient-text">Revendeurs</span> & Professionnels
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)' }}>
            Tarifs préférentiels, devis en ligne, suivi dédié et catalogue en temps réel.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 60,
              alignItems: 'center',
            }}
          >
            <div>
              <span className="overline">Pourquoi nous rejoindre</span>
              <h2 style={{ marginBottom: 16 }}>Votre partenaire de confiance</h2>
              <p style={{ color: 'var(--text-light)', marginBottom: 24 }}>
                Rejoignez plus de 300 revendeurs et entreprises au Maroc qui nous font confiance
                pour leur approvisionnement IT.
              </p>
              <ul style={{ margin: '24px 0', display: 'grid', gap: 12 }}>
                {[
                  'Prix revendeur exclusifs (grille tarifaire personnalisée)',
                  'Devis en ligne sous 24h',
                  'Livraison prioritaire à Casablanca et partout au Maroc',
                  "Compte gestionnaire d'achats multi-utilisateurs",
                  'Suivi des commandes et factures en temps réel',
                  'Catalogue synchronisé : disponibilité exacte des fournisseurs',
                ].map((b) => (
                  <li key={b} style={{ color: 'var(--text-light)' }}>
                    ✓ {b}
                  </li>
                ))}
              </ul>
              {isLoggedIn ? (
                <Link to="/compte" className="btn btn-primary btn-lg">
                  Accéder à mon tableau de bord
                </Link>
              ) : (
                <Link to="/register" className="btn btn-primary btn-lg">
                  Créer un compte professionnel
                </Link>
              )}
            </div>

            <div className="panel" style={{ background: 'var(--bg-alt)' }}>
              <h3 style={{ textAlign: 'center' }}>🎯 Exemple de grille tarifaire B2B</h3>
              {tiers.map(([name, price]) => (
                <div
                  key={name}
                  className="flex-between"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>{name}</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{price}</span>
                </div>
              ))}
              <Link
                to={isLoggedIn ? '/compte' : '/register'}
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}
              >
                {isLoggedIn ? 'Voir ma grille personnalisée →' : 'Demander ma grille →'}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
