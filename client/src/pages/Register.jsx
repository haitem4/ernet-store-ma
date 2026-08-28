// ============================================================
// ERNET STORE — Page d'inscription (B2C & B2B)
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('B2C');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({
        email,
        password,
        firstName,
        lastName,
        companyName: company,
        role,
      });
      navigate('/compte');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur d'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section">
      <div className="container">
        <div style={{ maxWidth: 480, margin: '0 auto' }}>
          <div className="section-title">
            <span className="overline">Nouveau client</span>
            <h2>Créer un compte</h2>
            <p>Rejoignez ERNET STORE — particulier ou professionnel</p>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Prénom</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Nom</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>
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
                placeholder="Min. 8 caractères"
                style={{ width: '100%' }}
                required
                minLength={8}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Entreprise (optionnel)</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Nom de votre société"
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Type de compte</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="B2C">Particulier (B2C)</option>
                <option value="B2B">Professionnel / Revendeur (B2B)</option>
              </select>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
              <label>
                <input type="checkbox" required /> J'accepte les{' '}
                <a href="#" style={{ color: 'var(--primary)' }}>
                  conditions générales
                </a>
              </label>
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Inscription...' : 'Créer mon compte'}
            </button>
          </form>

          <p
            className="text-center mt-24"
            style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}
          >
            Déjà un compte ?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Se connecter
            </Link>
          </p>
          <p
            className="text-center mt-16"
            style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}
          >
            <Link to="/espace-pro" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Tarifs revendeurs B2B →
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
