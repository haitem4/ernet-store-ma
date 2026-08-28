# 🗺️ Plan du Site — ernetstore.com

## Arborescence complète (B2C + B2B)

```
ernetstore.com/
│
├── /                           # Accueil (Home) — B2C / B2B
│
├── /catalogue                  # Catalogue général
│   ├── /composants-pc          # Composants PC
│   │   ├── /processeurs        # CPU (Intel, AMD)
│   │   ├── /cartes-meres       # Cartes mères
│   │   ├── /ram                # Mémoire RAM
│   │   ├── /stockage           # SSD, HDD, NVMe
│   │   ├── /cartes-graphiques  # GPU
│   │   ├── /alimentations      # PSU
│   │   ├── /boitiers           # Boîtiers PC
│   │   └── /ventilation        # Refroidissement
│   ├── /ordinateurs            # PC complets
│   │   ├── /pc-portables       # Laptops
│   │   ├── /pc-bureau          # Desktops
│   │   ├── /stations-travail   # Workstations
│   │   └── /serveurs           # Serveurs
│   ├── /reseaux                # Réseaux
│   │   ├── /switches
│   │   ├── /routeurs
│   │   ├── /points-acces       # AP WiFi
│   │   ├── /cables             # Câblage
│   │   └── /stockage-reseau    # NAS, SAN
│   ├── /peripheriques          # Périphériques
│   │   ├── /ecrans             # Moniteurs
│   │   ├── /claviers-souris    # Input devices
│   │   ├── /imprimantes        # Printers
│   │   ├── /scanners
│   │   └── /audio-video        # Webcams, micros, casques
│   ├── /logiciels              # Software
│   └── /accessoires            # Accessoires
│
├── /marques                    # Marques partenaires
│   ├── /intel
│   ├── /amd
│   ├── /nvidia
│   ├── /asus
│   ├── /dell
│   ├── /hp
│   ├── /lenovo
│   ├── /kingston
│   ├── /seagate
│   ├── /western-digital
│   ├── /corsair
│   ├── /cooler-master
│   └── /...
│
├── /promotions                 # Offres et promotions
│
├── /produit/[slug]             # Fiche produit détaillée
│
├── /recherche                  # Résultats de recherche avancée
│   └── ?q=...&marque=...&prix_min=...&prix_max=...&stock=...
│
├── /compte                     # Espace client (B2C + B2B)
│   ├── /connexion
│   ├── /inscription
│   ├── /tableau-de-bord        # Dashboard
│   ├── /commandes
│   ├── /factures
│   ├── /devis                  # Demande de devis (B2B)
│   ├── /adresses
│   ├── /favoris
│   └── /parametres
│
├── /panier                     # Panier
│
├── /commande                   # Tunnel d'achat
│   ├── /livraison
│   ├── /paiement
│   └── /confirmation
│
├── /pages                      # Pages statiques
│   ├── /a-propos               # À propos
│   ├── /contact                # Contact
│   ├── /cgv                    # Conditions générales de vente
│   ├── /mentions-legales       # Mentions légales
│   ├── /politique-confidentialite
│   ├── /livraison-retours      # Infos livraison et retours
│   └── /faq                    # FAQ
│
├── /blog                       # Blog technique & actualités
│   ├── /guides-achat
│   ├── /comparatifs
│   └── /actualites
│
├── /api                        # API (headless)
│   ├── /v1
│   │   ├── /products
│   │   ├── /categories
│   │   ├── /brands
│   │   ├── /cart
│   │   ├── /orders
│   │   ├── /auth
│   │   ├── /users
│   │   ├── /prices             # Tarifs B2B/B2C
│   │   ├── /stock
│   │   └── /sync               # Sync fournisseurs
│   └── /graphql                # GraphQL endpoint
│
├── /admin                      # Back-office (admin panel)
│   ├── /dashboard
│   ├── /produits
│   ├── /categories
│   ├── /commandes
│   ├── /clients
│   ├── /fournisseurs
│   ├── /tarifs                 # Grilles tarifaires
│   ├── /stock
│   ├── /sync                   # Synchronisation catalogue
│   ├── /marketing              # Promos, coupons
│   ├── /contenu                # CMS pages
│   └── /parametres
│
└── /[slug]                     # Pages SEO dynamiques (catégories, marques)
```

---

## Structure des URLs (SEO-friendly)

| Type      | Format                         | Exemple                               |
| --------- | ------------------------------ | ------------------------------------- |
| Catégorie | `/categorie/sous-categorie`    | `/composants-pc/processeurs`          |
| Produit   | `/produit/[slug-produit]`      | `/produit/intel-core-i7-14700k`       |
| Marque    | `/marques/[nom-marque]`        | `/marques/amd`                        |
| Recherche | `/recherche?q=[query]&filtres` | `/recherche?q=rtx+4070&marque=nvidia` |
| Client    | `/compte/[section]`            | `/compte/commandes`                   |

---

## Hiérarchie des types de contenu

```
1. Pages essentielles
   ├── Accueil, Catalogue, Fiche produit, Panier, Commande
2. Pages client (avec auth)
   ├── Dashboard, Commandes, Factures, Devis, Favoris
3. Pages B2B (réservées pros)
   ├── Tarifs spéciaux, Devis en ligne, Historique achats
4. Pages SEO / Marketing
   ├── Blog, Guides, Landing pages marques, Promotions
5. Pages légales & support
   ├── CGV, ML, FAQ, Contact, Livraison
6. Back-office (admin)
   ├── Gestion catalogue, commandes, clients, fournisseurs, sync
```

---

## Structure du Header (Navigation)

```
[LOGO]  [Recherche avec filtres]  [FR/EN]  [Connexion]  [Panier]

[Catalogue ▼]  [Marques]  [Promotions]  [Blog]  [Espace Pro B2B ▼]
├── Composants PC
├── Ordinateurs
├── Serveurs & Stockage
├── Réseaux
├── Périphériques
├── Logiciels
└── Accessoires
```

---

## Structure du Footer

```
Colonne 1: ERNET
├── À propos
├── CGV
├── Mentions légales
├── Politique de confidentialité
└── FAQ

Colonne 2: Produits
├── Composants PC
├── Ordinateurs
├── Serveurs
├── Réseaux
├── Périphériques
└── Accessoires

Colonne 3: Service client
├── Contact
├── Livraison & retours
├── Support technique
├── Devis professionnels
└── Réclamations

Colonne 4: Espace Pro
├── Créer un compte pro
├── Tarifs revendeurs
├── Devis en ligne
├── Suivi des commandes
└── Programme de fidélité

Colonne 5: Contact
├── 📍 Casablanca, Maroc
├── 📞 +212 5XX XX XX XX
├── ✉️ contact@ernetstore.com
├── 🕐 Lun-Ven: 8h-18h | Sam: 9h-13h
└── [Réseaux sociaux]
```
