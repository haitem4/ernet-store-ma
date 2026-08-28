// ============================================================
// ERNET STORE — LanguageContext (i18n FR/EN)
// Fournit un état global de langue et une fonction de traduction t()
// ============================================================
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const LanguageContext = createContext(null);

// --- Dictionnaire de traductions ---
const translations = {
  // Navigation globale
  home: { fr: 'Accueil', en: 'Home' },
  catalogue: { fr: 'Catalogue', en: 'Catalogue' },
  brands: { fr: 'Marques', en: 'Brands' },
  promotions: { fr: 'Promotions', en: 'Promotions' },
  blog: { fr: 'Blog et Guides', en: 'Blog and Guides' },
  pro: { fr: 'Espace Pro B2B', en: 'B2B Pro Hub' },
  cart: { fr: 'Panier', en: 'Cart' },
  account: { fr: 'Compte', en: 'Account' },
  login: { fr: 'Connexion', en: 'Login' },
  logout: { fr: 'Deconnexion', en: 'Logout' },
  myAccount: { fr: 'Mon compte', en: 'My account' },
  search: { fr: 'Rechercher un produit une marque', en: 'Search a product a brand' },

  // Composants PC
  components: { fr: 'Composants PC', en: 'PC Components' },
  cpus: { fr: 'Processeurs CPU', en: 'Processors CPU' },
  motherboards: { fr: 'Cartes meres', en: 'Motherboards' },
  ram: { fr: 'Memoire RAM', en: 'RAM Memory' },
  storage: { fr: 'Stockage SSD/HDD', en: 'Storage SSDHDD' },
  gpus: { fr: 'Cartes graphiques', en: 'Graphics cards' },
  psu: { fr: 'Alimentations', en: 'Power supplies' },
  cases: { fr: 'Boitiers', en: 'Cases' },
  computersAndServers: { fr: 'Ordinateurs et Serveurs', en: 'Computers and Servers' },
  laptops: { fr: 'PC Portables', en: 'Laptops' },
  tablets: { fr: 'Tablettes', en: 'Tablets' },
  smartphones: { fr: 'Smartphones', en: 'Smartphones' },
  desktops: { fr: 'PC de Bureau', en: 'Desktops' },
  workstations: { fr: 'Stations de travail', en: 'Workstations' },
  servers: { fr: 'Serveurs', en: 'Servers' },
  nas: {
    fr: 'Stockage reseau NAS',
    en: 'Network storage NAS',
    to: '/catalogue?category=Stockage',
  },
  networks: { fr: 'Reseaux et Peripheriques', en: 'Networks and Peripherals' },
  switches: {
    fr: 'Switches et Routeurs',
    en: 'Switches and Routers',
    to: '/catalogue?category=Reseau',
  },
  wifi: { fr: 'WiFi et Acces', en: 'WiFi and Access', to: '/catalogue?category=Reseau' },
  monitors: { fr: 'Moniteurs', en: 'Monitors' },
  printers: { fr: 'Imprimantes', en: 'Printers' },

  // Hero
  heroTitle: {
    fr: 'Votre partenaire IT de confiance au Maroc',
    en: 'Your trusted IT partner in Morocco',
  },
  heroSubtitle: {
    fr: 'Distributeur de materiel informatique professionnel. Composants PC, ordinateurs, serveurs, reseaux et peripheres aux meilleurs prix pour les professionnels et particuliers.',
    en: 'Authorized distributor of professional IT hardware. PC components, computers, servers, networks and peripherals at the best prices for businesses and individuals.',
  },
  browseCatalog: { fr: 'Explorer le catalogue', en: 'Browse catalog' },
  becomeReseller: { fr: 'Devenir revendeur', en: 'Become a reseller' },
  productsInStock: { fr: 'Produits en stock', en: 'Products in stock' },
  partnerBrands: { fr: 'Marques partenaires', en: 'Partner brands' },
  b2bClients: { fr: 'Clients B2B', en: 'B2B clients' },

  // Sections
  ourCategories: { fr: 'Nos categories', en: 'Our categories' },
  categoriesSub: {
    fr: 'Des milliers de produits en stock, livre rapidement au Maroc',
    en: 'Thousands of products in stock, delivered quickly across Morocco',
  },
  featuredProducts: { fr: 'Produits en vedette', en: 'Featured products' },
  featuredSub: {
    fr: 'Les meilleures offres du moment, selectees pour vous',
    en: 'Best deals of the moment, selected for you',
  },
  viewAllProducts: { fr: 'Voir tous les produits', en: 'View all products' },
  whyChoose: { fr: 'Pourquoi choisir ERNET ?', en: 'Why choose ERNET?' },
  whyChooseSub: {
    fr: 'Lexpertise IT au service de votre entreprise',
    en: 'IT expertise serving your business',
  },

  // Avantages
  fastDelivery: { fr: 'Livraison rapide', en: 'Fast delivery' },
  fastDeliverySub: {
    fr: 'Livraison sous 24-48h a Casablanca et partout au Maroc',
    en: 'Delivery within 24-48h in Casablanca and across Morocco',
  },
  warranty: { fr: 'Garantie constructeur', en: 'Manufacturer warranty' },
  warrantySub: {
    fr: 'Tous nos produits sont garantis par les constructeurs officiels',
    en: 'All products are covered by official manufacturer warranties',
  },
  techSupport: { fr: 'Support technique', en: 'Technical support' },
  techSupportSub: {
    fr: 'Une equipe dexperts a votre ecoute pour vous conseiller',
    en: 'A team of experts ready to advise you',
  },
  b2bPricing: { fr: 'Tarifs B2B exclusifs', en: 'Exclusive B2B pricing' },
  b2bPricingSub: {
    fr: 'Grille tarifaire deteee pour les revendeurs et professionnels',
    en: 'Dedicated pricing grid for resellers and professionals',
  },

  // B2B
  proHub: { fr: 'Espace Revendeurs et Professionnels', en: 'Resellers and Professionals Hub' },
  proHubSub: {
    fr: 'Accedez a des tarifs preferentiels, des devis en ligne, un suivi de commandes dedie et un catalogue avec disponibilite en temps reel. Creerez votre compte professionnel en quelques minutes.',
    en: 'Access preferential pricing, online quotes, dedicated order tracking, and a real-time stock catalog. Create your professional account in minutes.',
  },
  resellerPrices: { fr: 'Prix revendeur exclusifs', en: 'Exclusive reseller prices' },
  quotes24h: { fr: 'Devis en 24h', en: 'Quotes within 24h' },
  priorityDelivery: { fr: 'Livraison prioritaire', en: 'Priority delivery' },
  purchaseManager: { fr: 'Compte gestionnaire achats', en: 'Purchase manager account' },
  createProAccount: { fr: 'Crer un compte professionnel', en: 'Create a professional account' },
  b2bPricingGrid: { fr: 'Grille tarifaire B2B', en: 'B2B Pricing Grid' },
  viewPricing: { fr: 'Voir ma grille personnalise', en: 'View my custom pricing' },

  // Blog
  blogTitle: { fr: 'Blog et Guides achat', en: 'Blog and Buying Guides' },
  blogSub: {
    fr: 'Conseils, comparatifs et actualites du monde IT',
    en: 'Tips, comparisons and IT news',
  },
  viewAllArticles: { fr: 'Voir tous les articles', en: 'View all articles' },

  // Newsletter
  stayInformed: { fr: 'Restez informe', en: 'Stay informed' },
  newsletterSub: {
    fr: 'Recevez nos offres exclusives, nouveaux produits et actualites IT directement dans votre boite mail.',
    en: 'Receive exclusive offers, new products and IT news directly in your inbox.',
  },
  subscribe: { fr: "S'abonner", en: 'Subscribe' },
  emailPlaceholder: { fr: 'Votre adresse email', en: 'Your email address' },

  // Produits (badges)
  inStock: { fr: 'En stock', en: 'In stock' },
  lowStock: { fr: 'Stock limite', en: 'Low stock' },
  addToCart: { fr: 'Ajouter', en: 'Add' },
  new: { fr: 'Nouveau', en: 'New' },
  hot: { fr: 'Hot', en: 'Hot' },

  // Footer
  products: { fr: 'Produits', en: 'Products' },
  peripherals: { fr: 'Peripheriques', en: 'Peripherals', to: '/catalogue?category=Peripheriques' },
  accessories: { fr: 'Accessoires', en: 'Accessories', to: '/catalogue?category=Accessoires' },
  software: { fr: 'Logiciels', en: 'Software', to: '/catalogue?category=Logiciels' },
  company: { fr: 'Entreprise', en: 'Company' },
  about: { fr: 'A propos', en: 'About' },
  contact: { fr: 'Contact', en: 'Contact' },
  terms: { fr: 'CGV', en: 'Terms' },
  legal: { fr: 'Mentionslegales', en: 'Legal notice' },
  privacy: { fr: 'Confidentialite', en: 'Privacy' },
  faq: { fr: 'FAQ', en: 'FAQ' },
  proSection: { fr: 'Espace Pro', en: 'Pro Hub' },
  createPro: { fr: 'Creer un compte pro', en: 'Create a pro account' },
  dashboard: { fr: 'Tableau de bord', en: 'Dashboard' },
  requestQuote: { fr: 'Demander un devis', en: 'Request a quote' },
  orderTracking: { fr: 'Suivi des commandes', en: 'Order tracking' },
  deliveryReturns: { fr: 'Livraison et retours', en: 'Delivery and returns' },
  casablanca: { fr: 'Casablanca, Maroc', en: 'Casablanca, Morocco' },
  hours: { fr: 'Lun-Ven: 8h-18h', en: 'Mon-Fri: 8am-6pm' },
  allRights: { fr: 'Tous droits reserves', en: 'All rights reserved' },
  footerDesc: {
    fr: 'Distributeur de materiel informatique professionnel au Maroc. Plus de 5 000 produits en stock.',
    en: 'Authorized distributor of professional IT hardware in Morocco. Over 5,000 products in stock.',
  },

  // Categories (home)
  catComputers: { fr: 'Ordinateurs', en: 'Computers' },
  catServers: { fr: 'Serveurs et Stockage', en: 'Servers and Storage' },
  catNetworks: { fr: 'Reseaux', en: 'Networks' },
  catPeripherals: { fr: 'Peripheriques', en: 'Peripherals' },
  catBrands: { fr: 'Marques', en: 'Brands' },
  catDeals: { fr: 'Promotions', en: 'Deals' },
  catAccessories: { fr: 'Accessoires', en: 'Accessories' },
  tabTelephony: { fr: 'Tablettes et Telephony', en: 'Tab and Telephony' },
  televisions: { fr: 'Television', en: 'Television' },

  // Catalogue page
  filters: { fr: 'Filtres', en: 'Filters' },
  category: { fr: 'Categorie', en: 'Category' },
  brand: { fr: 'Marque', en: 'Brand' },
  price: { fr: 'Prix (MAD)', en: 'Price (MAD)' },
  availability: { fr: 'Disponibilite', en: 'Availability' },
  all: { fr: 'Tout', en: 'All' },
  onOrder: { fr: 'Sur commande', en: 'On order' },
  applyFilters: { fr: 'Appliquer les filtres', en: 'Apply filters' },
  productsFound: { fr: 'produits trouves', en: 'products found' },
  sortRelevance: { fr: 'Trier : Pertinence', en: 'Sort: Relevance' },
  sortPriceAsc: { fr: 'Prix croissant', en: 'Price: Low to High' },
  sortPriceDesc: { fr: 'Prix decroissant', en: 'Price: High to Low' },
  sortNew: { fr: 'Nouveautes', en: 'Newest' },
  sortPromo: { fr: 'Promotions', en: 'Promotions' },
  previous: { fr: 'Precedent', en: 'Previous' },
  next: { fr: 'Suivant', en: 'Next' },
  catalogTitle: { fr: 'Catalogue produits', en: 'Product catalog' },
  catalogSub: {
    fr: 'Plus de 5 000 produits en stock, prix et disponibilite synchronise en temps reel.',
    en: 'Over 5,000 products in stock, prices and availability synced in real time.',
  },

  // Admin Import Page
  adminDashboard: { fr: 'Tableau de bord Admin', en: 'Admin Dashboard' },
  diswayImport: { fr: 'Import Disway', en: 'Disway Import' },
  diswayImportTitle: { fr: 'Importation des tarifs Disway', en: 'Disway Price Import' },
  diswayImportDescription: {
    fr: 'Declenche limportation des tarifs Disway. Le systeme tentera de se connecter au portail, de telecharger le fichier et de mettre a jour le catalogue.',
    en: 'Triggers the Disway price import. The system will attempt to log in to the portal, download the file, and update the catalog.',
  },
  triggerDiswayImport: { fr: 'Lancer limport Disway', en: 'Trigger Disway Import' },
  importing: { fr: 'Importation en cours', en: 'Importing...' },
  importInProgress: {
    fr: "L'importation est en cours. Cela peut prendre quelques minutes.",
    en: 'Import in progress. This may take a few minutes.',
  },
  importFailedGeneric: { fr: "L'importation a echoue.", en: 'Import failed.' },
  importSuccess: { fr: 'Importation terminee avec succes !', en: 'Import completed successfully!' },
  imported: { fr: 'Produits importe', en: 'Products imported' },
  updated: { fr: 'Produits mis a jour', en: 'Products updated' },
  failed: { fr: 'Produits en echec', en: 'Products failed' },
  totalProcessed: { fr: 'Total traite', en: 'Total processed' },
  markupApplied: { fr: 'Marge appliquee', en: 'Markup applied' },
  error: { fr: 'Erreur', en: 'Error' },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('ernet_lang') || 'fr';
  });

  useEffect(() => {
    localStorage.setItem('ernet_lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'fr' ? 'en' : 'fr'));
  }, []);

  // Fonction de traduction
  const t = useCallback(
    (key, fallback) => {
      const entry = translations[key];
      return entry?.[lang] || entry?.fr || fallback || key;
    },
    [lang]
  );

  const value = { lang, setLang, toggleLang, t };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
}