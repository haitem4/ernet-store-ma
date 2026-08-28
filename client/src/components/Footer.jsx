// ============================================================
// ERNET STORE — Footer Pro & Bandeau de Réassurance Horizontal
// ============================================================
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext.jsx';
import Logo from './Logo.jsx';
import {
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  TruckIcon,
  ShieldIcon,
  HeadphonesIcon,
  TagIcon,
  GlobeIcon,
  ArrowRightIcon,
  WhatsAppIcon,
  InstagramIcon,
  LinkedInIcon,
  FacebookIcon,
} from './Icons.jsx';

export default function Footer() {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    products: [
      { label: 'Serveurs & Baies', to: '/catalogue?category=serveurs' },
      { label: 'PC & Portables', to: '/catalogue?category=pc-portables' },
      { label: 'Réseaux & Wi-Fi', to: '/catalogue?category=reseaux' },
      { label: 'Stockage & SSD', to: '/catalogue?category=stockage' },
      { label: 'Écrans & Moniteurs', to: '/catalogue?category=moniteurs' },
      { label: 'Logiciels & Licences', to: '/catalogue?category=logiciels' },
    ],
    company: [
      { label: t('about') || 'À propos', to: '/a-propos' },
      { label: 'Nos Marques Partenaires', to: '/marques' },
      { label: t('contact') || 'Contact', to: '/contact' },
      { label: t('terms') || 'CGV', to: '/cgv' },
      { label: t('legal') || 'Mentions légales', to: '/mentions-legales' },
      { label: t('privacy') || 'Confidentialité', to: '/confidentialite' },
    ],
    pro: [
      { label: 'Créer un Compte Pro B2B', to: '/register?type=b2b' },
      { label: 'Espace Revendeurs', to: '/espace-pro' },
      { label: 'Demande de Devis Express', to: '/espace-pro' },
      { label: 'Mon Compte Client', to: '/compte' },
      { label: 'Suivi de Commande', to: '/compte' },
    ],
    support: [
      { label: 'Garanties Constructeurs', to: '/garanties' },
      { label: 'Modes de Paiement Sécurisés', to: '/paiement' },
      { label: 'Délais & Frais de Livraison', to: '/livraison' },
      { label: 'Support & SAV', to: '/support' },
      { label: 'FAQ', to: '/faq' },
    ],
  };

  const paymentMethods = [
    { name: 'Paiement CMI', icon: '💳' },
    { name: 'Virement Bancaire', icon: '🏦' },
    { name: 'Chèque / Traite', icon: '📝' },
    { name: 'Paiement à la Livraison', icon: '💵' },
  ];

  const socialLinks = [
    {
      name: 'WhatsApp',
      href: 'https://wa.me/212600000000',
      icon: <WhatsAppIcon size={20} />,
      className: 'social-whatsapp',
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/ernetstore',
      icon: <InstagramIcon size={20} />,
      className: 'social-instagram',
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/ernetstore',
      icon: <LinkedInIcon size={20} />,
      className: 'social-linkedin',
    },
    {
      name: 'Facebook',
      href: 'https://facebook.com/ernetstore',
      icon: <FacebookIcon size={20} />,
      className: 'social-facebook',
    },
  ];

  return (
    <footer className="footer" role="contentinfo">
      {/* ============ BANDEAU DE RÉASSURANCE HORIZONTAL ============ */}
      <div className="footer-reassurance-strip">
        <div className="container">
          <div className="reassurance-grid">
            <div className="reassurance-card">
              <div className="reassurance-icon">
                <TruckIcon size={26} />
              </div>
              <div className="reassurance-content">
                <strong>Livraison Express 24-48h</strong>
                <span>Casablanca & tout le Maroc</span>
              </div>
            </div>

            <div className="reassurance-card">
              <div className="reassurance-icon">
                <ShieldIcon size={26} />
              </div>
              <div className="reassurance-content">
                <strong>Garantie Constructeur</strong>
                <span>Produits neufs & 100% certifiés</span>
              </div>
            </div>

            <div className="reassurance-card">
              <div className="reassurance-icon">
                <TagIcon size={26} />
              </div>
              <div className="reassurance-content">
                <strong>Tarifs Dégressifs B2B</strong>
                <span>Comptes pro & revendeurs</span>
              </div>
            </div>

            <div className="reassurance-card">
              <div className="reassurance-icon">
                <HeadphonesIcon size={26} />
              </div>
              <div className="reassurance-content">
                <strong>Assistance Technique</strong>
                <span>Experts serveurs & réseaux</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ CORPS PRINCIPAL DU FOOTER ============ */}
      <div className="footer-main">
        <div className="container">
          <div className="footer-grid">
            {/* Colonne Marque & Contact */}
            <div className="footer-col footer-brand">
              <Link to="/" className="footer-logo" aria-label="Accueil ERNET STORE">
                <Logo size="md" withText={true} variant="light" />
              </Link>
              <p className="footer-tagline">
                Distributeur de solutions informatiques, serveurs d'entreprise, réseaux et matériel
                high-tech pour professionnels et particuliers au Maroc.
              </p>

              <div className="footer-contact">
                <div className="footer-contact-item">
                  <MapPinIcon size={18} />
                  <span>142 Bd Mohamed V, Casablanca 20000, Maroc</span>
                </div>
                <div className="footer-contact-item">
                  <PhoneIcon size={18} />
                  <a href="tel:+212522204060">+212 5 22 20 40 60</a>
                </div>
                <div className="footer-contact-item">
                  <MailIcon size={18} />
                  <a href="mailto:contact@ernet.ma">contact@ernet.ma</a>
                </div>
              </div>

              {/* Réseaux Sociaux avec vraies icônes SVG */}
              <div className="footer-social-hub">
                <span className="social-label">Suivez-nous :</span>
                <div className="social-links-row">
                  {socialLinks.map((s) => (
                    <a
                      key={s.name}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.name}
                      className={`social-circle-btn ${s.className}`}
                      title={s.name}
                    >
                      {s.icon}
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Rayons Produits */}
            <div className="footer-col">
              <h4>Rayons & Produits</h4>
              <ul>
                {footerLinks.products.map((link, i) => (
                  <li key={i}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Entreprise */}
            <div className="footer-col">
              <h4>ERNET STORE</h4>
              <ul>
                {footerLinks.company.map((link, i) => (
                  <li key={i}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Espace Pro B2B */}
            <div className="footer-col">
              <h4>Espace Pro B2B</h4>
              <ul>
                {footerLinks.pro.map((link, i) => (
                  <li key={i}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support & Newsletter */}
            <div className="footer-col footer-support">
              <h4>Service Client & Devis</h4>
              <ul className="support-links">
                {footerLinks.support.map((link, i) => (
                  <li key={i}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>

              <div className="newsletter-box">
                <p className="newsletter-text">Recevez nos arrivages et tarifs déstockage :</p>
                <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                  <div className="newsletter-input-wrapper">
                    <MailIcon size={18} />
                    <input
                      type="email"
                      placeholder="Votre adresse email pro..."
                      className="newsletter-input"
                      aria-label="Email Newsletter"
                    />
                  </div>
                  <button type="submit" className="newsletter-btn" aria-label="S'abonner">
                    <span>S'abonner</span>
                    <ArrowRightIcon size={16} />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============ MOYENS DE PAIEMENT SÉCURISÉS ============ */}
      <div className="footer-payments-bar">
        <div className="container">
          <div className="payments-row">
            <div className="payments-label">
              <GlobeIcon size={16} />
              <span>Moyens de paiement & facturation acceptés au Maroc :</span>
            </div>
            <div className="payments-badges">
              {paymentMethods.map((pm) => (
                <span key={pm.name} className="payment-pill">
                  {pm.icon} {pm.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ============ BAS DE PAGE & COPYRIGHT ============ */}
      <div className="footer-bottom">
        <div className="container">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} ERNET STORE. Tous droits réservés. Vente de matériel informatique &
              Solutions IT.
            </p>
            <div className="footer-bottom-links">
              <Link to="/cgv">CGV</Link>
              <Link to="/mentions-legales">Mentions légales</Link>
              <Link to="/confidentialite">Confidentialité</Link>
              <Link to="/cookies">Gestion des cookies</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}