// ============================================================
// ERNET STORE — Hook pour scroll vers le haut au changement de route
// ============================================================
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Si ancre, scroller vers l'élément
      const element = document.getElementById(hash.slice(1));
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.focus({ preventScroll: true });
      }
    } else {
      // Sinon scroll en haut
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      // Focus sur main pour l'accessibilité
      const main = document.getElementById('main-content');
      if (main) main.focus({ preventScroll: true });
    }
  }, [pathname, hash]);
}