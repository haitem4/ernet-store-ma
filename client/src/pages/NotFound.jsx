import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="section">
      <div className="container text-center" style={{ padding: '80px 0' }}>
        <div style={{ fontSize: '6rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
          404
        </div>
        <h2 style={{ margin: '16px 0' }}>Page introuvable</h2>
        <p style={{ color: 'var(--text-light)', marginBottom: 32 }}>
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">
          Retour a l'accueil
        </Link>
      </div>
    </section>
  );
}
