// ============================================================
// ERNET STORE — Layout principal
// ============================================================
import { Outlet } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import { useScrollToTop } from '../hooks/useScrollToTop.js';

export default function Layout() {
  useScrollToTop();

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content" id="main-content" role="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <a href="#main-content" className="skip-link">
        Aller au contenu principal
      </a>
    </div>
  );
}