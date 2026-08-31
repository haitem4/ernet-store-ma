import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCatalogExcel, cleanNumeric, normalize, slugify } from './src/etl/excel-parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const TARGET_FILE = path.join(__dirname, '..', 'client', 'src', 'data', 'fallbackProducts.js');

// Map visual category images
const CATEGORY_DEFAULT_IMAGES = {
  'serveurs': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&auto=format&fit=crop&q=60',
  'pc-portables': 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop&q=60',
  'reseaux': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60',
  'stockage': 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=500&auto=format&fit=crop&q=60',
  'imprimantes': 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60',
  'accessoires': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=500&auto=format&fit=crop&q=60',
  'logiciels': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=500&auto=format&fit=crop&q=60',
  'videosurveillance': 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&auto=format&fit=crop&q=60',
};

// Map sheet / keyword to standardized category slug
function mapToStandardCategory(catName, sheetName, productName) {
  const text = normalize(`${catName} ${sheetName} ${productName}`);
  if (/serveur|server|poweredge|proliant|thinksystem|rack|chassis/.test(text)) return { slug: 'serveurs', name: 'Serveurs & Baies' };
  if (/portable|laptop|notebook|thinkpad|latitude|vostro|expertbook|desktop|optiplex|probook|elitebook|ecran|moniteur/.test(text)) return { slug: 'pc-portables', name: 'PC & Portables' };
  if (/reseau|switch|routeur|router|wifi|tp-link|cisco|borne|firewall|unifi/.test(text)) return { slug: 'reseaux', name: 'Réseaux & Wi-Fi' };
  if (/synology|nas|disque|ssd|hdd|memoire|ram|lexar|samsung|nvme|barrette/.test(text)) return { slug: 'stockage', name: 'Stockage & SSD' };
  if (/imprimante|printer|canon|epson|laserjet|ecotank|brother|lexmark|copieur|toner/.test(text)) return { slug: 'imprimantes', name: 'Impression & Scanners' };
  if (/onduleur|ups|eaton|apc|batterie|energie|prise|multiprise|cablage/.test(text)) return { slug: 'accessoires', name: 'Accessoires & Onduleurs' };
  if (/logiciel|software|microsoft|cloud|csp|windows|office|antivirus/.test(text)) return { slug: 'logiciels', name: 'Logiciels & Licences' };
  if (/video|surveillance|camera|cctv|dvr|nvr|dahua|hikvision/.test(text)) return { slug: 'videosurveillance', name: 'Vidéosurveillance' };
  return { slug: 'accessoires', name: 'Accessoires & Câblage' };
}

// Nettoie la marque
function cleanBrand(brandRaw, name, sheet) {
  const text = normalize(`${brandRaw} ${name} ${sheet}`);
  if (/dell/.test(text)) return 'Dell';
  if (/hpe|hp enterprise/.test(text)) return 'HPE';
  if (/\bhp\b|hewlett/.test(text)) return 'HP';
  if (/lenovo|thinkpad|thinksystem/.test(text)) return 'Lenovo';
  if (/asus/.test(text)) return 'ASUS';
  if (/synology/.test(text)) return 'Synology';
  if (/cisco/.test(text)) return 'Cisco';
  if (/tp-link|tplink/.test(text)) return 'TP-Link';
  if (/samsung/.test(text)) return 'Samsung';
  if (/lexar/.test(text)) return 'Lexar';
  if (/eaton/.test(text)) return 'Eaton';
  if (/apc/.test(text)) return 'APC';
  if (/canon/.test(text)) return 'Canon';
  if (/epson/.test(text)) return 'Epson';
  if (/brother/.test(text)) return 'Brother';
  if (/microsoft/.test(text)) return 'Microsoft';
  if (/kingston/.test(text)) return 'Kingston';
  if (/seagate/.test(text)) return 'Seagate';
  if (/ubiquiti/.test(text)) return 'Ubiquiti';
  return brandRaw && brandRaw !== 'Disway' && !/accueil|feuil|options/i.test(brandRaw) ? brandRaw : 'Disway Certifié';
}

async function run() {
  console.log('🔄 Extraction des données réelles depuis les 11 fichiers Excel Disway...');
  const files = fs.readdirSync(UPLOADS_DIR).filter(f => /\.(xlsx|xls)$/i.test(f) && !f.startsWith('~$')).map(f => path.join(UPLOADS_DIR, f));

  let allProducts = [];
  for (const file of files) {
    try {
      const parsed = await parseCatalogExcel(file);
      allProducts.push(...parsed);
    } catch (err) {
      console.warn(`⚠️ Erreur sur ${path.basename(file)}:`, err.message);
    }
  }

  console.log(`📊 Total de produits extraits : ${allProducts.length}`);

  // Filtrer les produits valides avec vrai SKU et prix
  const validProducts = allProducts.filter(p => {
    return p.sku && p.sku.length >= 3 && p.costPrice > 10 && p.name && !/total|page|promo|acceuil/i.test(p.sku);
  });

  console.log(`✨ Produits valides avec prix & SKU : ${validProducts.length}`);

  // Standardiser et formater
  const formattedProducts = validProducts.map((p, index) => {
    const brand = cleanBrand(p.brand, p.name, p.category);
    const cat = mapToStandardCategory(p.category, p.subCategory, p.name);

    let cleanName = p.name;
    // Supprimer les sauts de lignes multiples dans le nom
    if (cleanName.includes('\n')) {
      cleanName = cleanName.split('\n')[0].trim();
    }
    if (cleanName.length < 5 || cleanName.toLowerCase() === p.sku.toLowerCase()) {
      cleanName = `${brand} ${p.sku} ${p.category || ''}`.trim();
    }

    // Image
    let imageUrl = CATEGORY_DEFAULT_IMAGES[cat.slug] || CATEGORY_DEFAULT_IMAGES['serveurs'];
    if (p.images && p.images.length > 0 && p.images[0].startsWith('/uploads')) {
      imageUrl = p.images[0];
    }

    // Specs de base
    const specs = p.specs && Object.keys(p.specs).length > 0 ? p.specs : {
      'Réf. Fournisseur': p.sku,
      'Garantie': 'Constructeur 1 à 3 ans',
      'Origine': 'Disway Maroc Officiel',
    };

    return {
      id: `disway-${p.sku.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${index + 1}`,
      sku: p.sku,
      name: cleanName,
      slug: slugify(`${brand}-${cleanName}-${p.sku}`),
      category: cat.slug,
      categoryName: cat.name,
      brand: brand,
      price: p.price, // costPrice x 1.15
      costPrice: p.costPrice,
      compareAt: Math.round(p.price * 1.12),
      stock: p.stock > 0 ? p.stock : 10,
      isNew: index % 5 === 0,
      isFeatured: p.price > 5000 && index % 3 === 0,
      supplier: 'Disway Officiel',
      specs: specs,
      images: [imageUrl],
      description: p.description || cleanName,
    };
  });

  // Sélectionner un échantillon équilibré de 120-180 produits pour un affichage instantané fluide
  const categoryBuckets = {};
  for (const p of formattedProducts) {
    if (!categoryBuckets[p.category]) categoryBuckets[p.category] = [];
    categoryBuckets[p.category].push(p);
  }

  const finalSelectedProducts = [];
  for (const [cat, prods] of Object.entries(categoryBuckets)) {
    // Prendre jusqu'à 30 produits par catégorie
    finalSelectedProducts.push(...prods.slice(0, 30));
  }

  // Calculer les catégories avec leurs comptes réels
  const categoriesMap = {};
  for (const p of formattedProducts) {
    if (!categoriesMap[p.category]) {
      categoriesMap[p.category] = { name: p.categoryName, slug: p.category, count: 0 };
    }
    categoriesMap[p.category].count++;
  }
  const finalCategories = Object.values(categoriesMap).sort((a, b) => b.count - a.count);

  // Calculer les marques avec leurs comptes réels
  const brandsMap = {};
  for (const p of formattedProducts) {
    if (!brandsMap[p.brand]) {
      brandsMap[p.brand] = { name: p.brand, slug: slugify(p.brand), count: 0 };
    }
    brandsMap[p.brand].count++;
  }
  const finalBrands = Object.values(brandsMap).filter(b => b.count >= 2).sort((a, b) => b.count - a.count);

  // Générer le code JavaScript pour fallbackProducts.js
  const fileContent = `// ============================================================
// ERNET STORE — Catalogue Réel Fournisseur Disway (Marge x1.15)
// Généré automatiquement depuis les 11 fichiers Excel Disway officiels
// ============================================================

export const FALLBACK_CATEGORIES = ${JSON.stringify(finalCategories, null, 2)};

export const FALLBACK_BRANDS = ${JSON.stringify(finalBrands, null, 2)};

export const FALLBACK_PRODUCTS = ${JSON.stringify(finalSelectedProducts, null, 2)};
`;

  fs.writeFileSync(TARGET_FILE, fileContent, 'utf-8');
  console.log(`✅ Fichier généré avec succès dans : ${TARGET_FILE}`);
  console.log(`📦 ${finalSelectedProducts.length} produits réels Disway intégrés (sur ${formattedProducts.length} références totales).`);
  console.log(`🏷️ ${finalCategories.length} catégories et ${finalBrands.length} marques réelles configurées.`);
}

run();
