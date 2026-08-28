// ============================================================
// ERNET STORE — Page d'administration pour l'import Disway
// (moved to pages/admin)
// ============================================================
import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { Link } from 'react-router-dom';

export default function AdminImportPage() {
  const { token } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleImport = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/admin/sync/disway`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('importFailedGeneric'));
      }

      const data = await response.json();
      setSuccess(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  return (
    <section className="page-hero">
      <div className="container">
        <div className="breadcrumb">
          <Link to="/admin">{t('adminDashboard')}</Link> <span className="sep">/</span>{' '}
          <span>{t('diswayImport')}</span>
        </div>
        <h1>
          <span className="gradient-text">{t('diswayImportTitle')}</span>
        </h1>
        <p>{t('diswayImportDescription')}</p>

        <div style={{ marginTop: '2rem' }}>
          <button onClick={handleImport} disabled={loading} className="btn btn-primary">
            {loading ? t('importing') : t('triggerDiswayImport')}
          </button>

          {loading && (
            <p style={{ marginTop: '1rem', color: 'var(--primary)' }}>{t('importInProgress')}</p>
          )}
          {error && (
            <p style={{ marginTop: '1rem', color: 'var(--danger)' }}>
              {t('error')}: {error}
            </p>
          )}
          {success && (
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                border: '1px solid var(--success)',
                borderRadius: '8px',
                background: 'var(--bg-alt)',
              }}
            >
              <p style={{ color: 'var(--success)', fontWeight: 'bold' }}>{t('importSuccess')}</p>
              <p>
                {t('imported')}: {success.imported}
              </p>
              <p>
                {t('updated')}: {success.updated}
              </p>
              <p>
                {t('failed')}: {success.failed}
              </p>
              <p>
                {t('totalProcessed')}: {success.total}
              </p>
              <p>
                {t('markupApplied')}: {success.markup}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
