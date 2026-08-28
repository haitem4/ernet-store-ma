// ============================================================
// ERNET STORE — Blog & Guides d'achat
// ============================================================
import { Link } from 'react-router-dom';

const posts = [
  [
    '📝',
    "Guide d'achat",
    'Comment choisir son processeur en 2025 ?',
    'Intel vs AMD : comparaison des gammes, sockets, performances et rapport qualité-prix pour chaque usage.',
    '12 Jan 2026',
    '5 min',
  ],
  [
    '⚡',
    'Comparatif',
    'Les meilleures cartes graphiques pour le gaming et la création',
    'RTX 40 series vs RX 7000 : benchmarks, prix et disponibilité au Maroc.',
    '8 Jan 2026',
    '7 min',
  ],
  [
    '🏢',
    'PME',
    'Quel serveur pour votre entreprise ? Guide complet',
    'Dell PowerEdge, HPE ProLiant ou Lenovo ThinkSystem : lequel choisir pour votre infrastructure.',
    '3 Jan 2026',
    '6 min',
  ],
  [
    '💡',
    'Conseils',
    'Bien choisir sa mémoire RAM en 2026',
    'DDR4 vs DDR5, fréquences, latences et capacité : tout savoir pour optimiser votre PC.',
    '28 Déc 2025',
    '4 min',
  ],
  [
    '🌐',
    'Réseaux',
    "Sécuriser et optimiser son réseau d'entreprise",
    'Switches, VLAN, WiFi 6 : les bonnes pratiques pour une infrastructure performante.',
    '20 Déc 2025',
    '8 min',
  ],
  [
    '🖥️',
    'Composants',
    'Montage PC : le guide complet pour débutants',
    "De la carte mère à l'alimentation, suivez notre guide pas à pas pour monter votre PC.",
    '15 Déc 2025',
    '10 min',
  ],
];

export default function Blog() {
  return (
    <>
      <section className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <a href="/">Accueil</a> <span className="sep">/</span> <span>Blog</span>
          </div>
          <h1>
            <span className="gradient-text">Blog & Guides d'achat</span>
          </h1>
          <p>Conseils, comparatifs et actualités du monde IT.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {posts.map(([icon, category, title, excerpt, date, read]) => (
              <article key={title} className="blog-card">
                <div
                  className="blog-img"
                  style={{
                    height: 180,
                    background: 'var(--bg-alt)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2.5rem',
                  }}
                >
                  {icon}
                </div>
                <div className="blog-body" style={{ padding: 20 }}>
                  <div
                    className="blog-category"
                    style={{
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      color: 'var(--primary)',
                      fontWeight: 700,
                      marginBottom: 8,
                    }}
                  >
                    {category}
                  </div>
                  <h3
                    className="blog-title"
                    style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}
                  >
                    {title}
                  </h3>
                  <p
                    className="blog-excerpt"
                    style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: 12 }}
                  >
                    {excerpt}
                  </p>
                  <div
                    className="blog-meta"
                    style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}
                  >
                    {date} • {read} de lecture
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="text-center mt-32">
            <Link to="/blog" className="btn btn-outline">
              Voir tous les articles →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
