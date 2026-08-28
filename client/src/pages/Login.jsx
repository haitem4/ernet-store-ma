// ============================================================
// ERNET STORE — Page de connexion
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'B2B' || user.role === 'ADMIN' ? '/compte' : '/compte');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <div className="section-title">
            <span className="overline">Bienvenue</span>
            <h2>Connexion</h2>
            <p>Accédez à votre espace client ou professionnel</p>
          </div>

          {error && (
            <p
              style={{
                background: '#fef2f2',
                color: 'var(--error)',
                padding: 12,
                borderRadius: 8,
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.ma"
                style={{ width: '100%' }}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%' }}
                required
              />
            </div>
            <div className="flex-between" style={{ fontSize: '0.85rem' }}>
              <label>
                <input type="checkbox" /> Se souvenir de moi
              </label>
              <a href="#" style={{ color: 'var(--primary)' }}>
                Mot de passe oublié ?
              </a>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p
            className="text-center mt-24"
            style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}
          >
            Pas encore de compte ?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              S'inscrire
            </Link>
          </p>
          <p
            className="text-center mt-16"
            style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}
          >
            <Link to="/espace-pro" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Espace revendeur B2B →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
