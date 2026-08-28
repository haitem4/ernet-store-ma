#!/usr/bin/env node
// ============================================================
// ERNET STORE — Script autonome de synchronisation Disway
// ------------------------------------------------------------
// Télécharge les fichiers de prix Disway, les parse, applique
// la marge x1.5 (hors taxe) et stocke en base PostgreSQL.
//
// Utilisation :
//   node sync-disway.js              (télécharge depuis les URLs configurées)
//   node sync-disway.js --local      (utilise les fichiers dans uploads/)
//   node sync-disway.js --dry-run    (affiche les produits sans import)
//   node sync-disway.js --clear      (vide le catalogue avant import)
//   node sync-disway.js --images     (scrape les images des fiches produit)
// ============================================================
import 'dotenv/config';
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import { scrapeProductImages } from './src/services/disway.images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const LOG_DIR = path.join(__dirname, '..', 'logs');

const prisma = new PrismaClient();

// ============================================================
// Configuration
// ============================================================
const MARKUP = Number(process.env.DISWAY_MARKUP || 1.15);

const DISWAY_URLS = (process.env.DISWAY_XLSX_URLS || process.env.DISWAY_XLSX_URL || '')
  .split(/[;,\s]+/)
  .filter(Boolean);

const DISWAY_EMAIL = process.env.DISWAY_EMAIL;
const DISWAY_PASSWORD = process.env.DISWAY_PASSWORD;
const DISWAY_LOGIN_URL =
  process.env.DISWAY_LOGIN_URL || 'https://www.disway.com/profile/login?backurl=%2Fliste-de-prix';
const DISWAY_PRICE_LIST_URL =
  process.env.DISWAY_PRICE_LIST_URL || 'https://www.disway.com/liste-de-prix';

// ============================================================
// Arguments CLI
// ============================================================
const args = process.argv.slice(2);
const LOCAL_ONLY = args.includes('--local');
const DRY_RUN = args.includes('--dry-run');
const CLEAR_FIRST = args.includes('--clear');
const SCRAPE_IMAGES = args.includes('--images');

// ============================================================
// Utilitaires
// ============================================================
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;

  let cleaned = String(value).trim();
  if (!cleaned) return null;

  if (/^\d+\s*(to|tb|go|gb|mo|mb|ko|kb)$/i.test(cleaned)) return null;

  cleaned = cleaned.replace(/[^\d.,-]/g, '').replace(/\s/g, '');
  if (!cleaned) return null;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length !== 3) {
      cleaned = cleaned.replace(/,/g, '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (hasDot) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '');
    } else if (parts.length === 2 && parts[1].length === 3) {
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

function uniqueSlug(base, used) {
  let slug = base || 'produit';
  let n = 2;
  while (used.has(slug)) {
    slug = `${base}-${n}`;
    n++;
  }
  used.add(slug);
  return slug;
}

// ============================================================
// Normalisation des catégories
// ============================================================
function normalizeCategoryName(rawCategory) {
  const s = norm(rawCategory);
  if (!s) return null;

  if (/\b(processeur|cpu|intel|amd|ryzen|xeon|core|athlon)\b/.test(s)) return 'Processeurs';
  if (/\b(carte\s*m[eè]re|motherboard|mb|mainboard)\b/.test(s)) return 'Cartes mères';
  if (/\b(m[eé]moire|ram|ddr|sodimm|module)\b/.test(s)) return 'Mémoire RAM';
  if (/\b(stockage|ssd|hdd|nvme|disque|raid|nas|storage|sata|sas)\b/.test(s)) return 'Stockage';
  if (/\b(carte\s*graphique|gpu|videocard|graphics|nvidia|radeon|geforce|rtx|gtx)\b/.test(s))
    return 'Cartes graphiques';
  if (/\b(alimentation|psu|power supply|bloc\s*d?alimentation)\b/.test(s)) return 'Alimentations';
  if (/\b(bo[iî]tier|chassis|case|tour)\b/.test(s)) return 'Boîtiers';
  if (
    /\b(ordinateur|ordinateur\s*portable|portable|laptop|notebook|pc\s*portable|desktop|workstation)\b/.test(
      s
    )
  )
    return 'Ordinateurs';
  if (/\b(serveur|server|rack|tour\s*serveur)\b/.test(s)) return 'Serveurs';
  if (
    /\b(r[eé]seau|network|switch|routeur|router|wifi|lan|wan|cable|câble|modem|firewall|routeur)\b/.test(
      s
    )
  )
    return 'Réseau';
  if (
    /\b(vid[eéo]o|surveillance|camera|cam[eé]ra|cctv|dvr|nvr|video surveillance|camera)\b/.test(s)
  )
    return 'Vidéo surveillance';
  if (/\b(imprimante|printer|scanner|multifonction|laserjet|inkjet)\b/.test(s))
    return 'Imprimantes';
  if (
    /\b(logiciel|software|windows|office|antivirus|licence|license|os|program|application)\b/.test(
      s
    )
  )
    return 'Logiciels';
  if (
    /\b(t[eé]l[eé]phone|gsm|mobile|smartphone|iphone|galaxy|pixel|oneplus|xiaomi|samsung|huawei|oppo|vivo)\b/.test(
      s
    )
  )
    return 'Smartphones';
  if (/\b(tablette|ipad|surface|tab|mediapad|galaxy\s*tab|lenovo\s*tab)\b/.test(s))
    return 'Tablettes';
  if (/\b(accessoire|accessory|cable|chargeur|housse|support|adaptateur|dongle)\b/.test(s))
    return 'Accessoires';
  if (
    /\b(p[eé]riph[eé]rique|peripheral|ecran|écran|moniteur|monitor|souris|mouse|clavier|keyboard|headset|casque|webcam)\b/.test(
      s
    )
  )
    return 'Périphériques';
  if (/\b(solution|solutions)\b/.test(s)) return 'Solutions';
  if (/\b(promotion)\b/.test(s)) return 'Promotions';
  if (/\b(option|options)\b/.test(s)) return 'Options';
  if (/\b(solar|solaire|panneau|batterie|onduleur|ups|solarway)\b/.test(s)) return 'Solaire';
  if (/\b(destockage|destockage|promotion|solde)\b/.test(s)) return 'Destockage';

  return null;
}

function categoryFromSheetName(sheetName) {
  const normalized = normalizeCategoryName(sheetName);
  if (normalized) return normalized;

  const s = norm(sheetName);
  if (/serveur|server/.test(s)) return 'Serveurs';
  if (/networking|switch|reseau/.test(s)) return 'Réseau';
  if (/option/.test(s)) return 'Options';
  if (/stockage|destockage/.test(s)) return 'Stockage';
  if (/promotion/.test(s)) return 'Promotions';
  if (/solar|solaire/.test(s)) return 'Solaire';
  if (/imprimante|printer|copieur/.test(s)) return 'Imprimantes';
  if (/video|surveillance/.test(s)) return 'Vidéo surveillance';
  if (/accessoire/.test(s)) return 'Accessoires';
  if (/solution/.test(s)) return 'Solutions';
  if (/logiciel|software/.test(s)) return 'Logiciels';
  if (/portable|laptop/.test(s)) return 'Ordinateurs';
  return 'Composants PC';
}

function brandFromSheetName(sheetName) {
  const s = norm(sheetName);
  if (/dell/.test(s)) return 'Dell';
  if (/hp|hpe/.test(s)) return 'HP';
  if (/lenovo/.test(s)) return 'Lenovo';
  if (/synolog/.test(s)) return 'Synology';
  if (/emc/.test(s)) return 'EMC';
  if (/asus/.test(s)) return 'ASUS';
  if (/intel/.test(s)) return 'Intel';
  if (/nvidia/.test(s)) return 'NVIDIA';
  if (/kingston/.test(s)) return 'Kingston';
  if (/seagate/.test(s)) return 'Seagate';
  if (/western|wd\b/.test(s)) return 'Western Digital';
  if (/corsair/.test(s)) return 'Corsair';
  if (/msi/.test(s)) return 'MSI';
  if (/gigabyte/.test(s)) return 'Gigabyte';
  if (/logitech/.test(s)) return 'Logitech';
  if (/solarway/.test(s)) return 'Solarway';
  return null;
}

// ============================================================
// Parsing Excel
// ============================================================
function findHeaderRow(rows) {
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i] || [];
    let hasRef = false,
      hasPrix = false;
    for (const c of cells.slice(0, 12)) {
      const n = norm(c);
      if (/ref|reference|r[eé]f[eé]rence|sku|code|article|product ?number/.test(n)) hasRef = true;
      if (/prix|tarif|price|cout|cost|ht/.test(n)) hasPrix = true;
    }
    if (hasRef && hasPrix) return i;
  }
  return 1;
}

function findHeaderColumn(header, envKey, fallbackRegex) {
  if (!Array.isArray(header)) return -1;
  if (envKey) {
    const normalizedKey = norm(envKey);
    const exact = header.findIndex((h) => h === normalizedKey);
    if (exact !== -1) return exact;
    return header.findIndex((h) => h.includes(normalizedKey));
  }
  return header.findIndex((h) => fallbackRegex.test(h));
}

function findNumericPriceColumn(raw, headerIdx, header, colName, colDispo) {
  const rows = raw.slice(headerIdx + 1, headerIdx + 8);
  const candidates = [];
  for (let c = 0; c < header.length; c++) {
    if (c === colName || c === colDispo) continue;
    const title = header[c] || '';
    if (/stock|dispo|quantit[eé]|qte|qty|reste|unit[eé]?|pu\b|u\/n|poids|weight/i.test(title))
      continue;
    if (/capacit|taille|size|volume|to$|tb$|go$|gb$/i.test(title)) continue;
    candidates.push(c);
  }
  for (const col of candidates) {
    const numericCount = rows.reduce(
      (count, row) => count + (toNumber(row[col]) !== null ? 1 : 0),
      0
    );
    if (numericCount >= 2) return col;
  }
  return -1;
}

function extractPriceFromRow(cells, header, colName, colDispo) {
  for (let i = colName + 1; i < cells.length; i++) {
    const title = header[i] || '';
    if (
      /stock|dispo|quantit[eé]|qte|qty|reste|unit[eé]?|pu\b|poids|weight|capacit|taille|size|volume/i.test(
        title
      )
    )
      continue;
    const value = toNumber(cells[i]);
    if (value !== null && value > 0) return value;
  }
  return null;
}

function buildName(cells, header, colName) {
  let name = String(cells[colName] ?? '').trim();
  if (!name) return '';
  const next = colName + 1;
  if (
    next < header.length &&
    !/prix|tarif|price|stock|dispo|quantit[eé]|cout|cost|ref|sku|code|marque|brand|categorie|category|capacit|poids|weight|pu\b|u\/n/i.test(
      header[next]
    )
  ) {
    const extra = String(cells[next] ?? '').trim();
    if (extra && extra !== name) name = `${name} ${extra}`.trim();
  }
  return name;
}

function parseExcelFile(filePath, usedSlugs) {
  const products = [];
  const skippedSheets = [];

  const workbook = XLSX.readFile(filePath);
  for (const sheetName of workbook.SheetNames) {
    const raw = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      defval: '',
      raw: false,
    });
    if (!raw || raw.length < 3) continue;

    const headerIdx = findHeaderRow(raw);
    const header = raw[headerIdx].map((c) => norm(c));

    const colRef = findHeaderColumn(
      header,
      process.env.DISWAY_COL_SKU,
      /ref|sku|code|article|product ?number|r[eé]f[eé]rence/
    );
    const colName = findHeaderColumn(
      header,
      process.env.DISWAY_COL_NAME,
      /d[eé]signation|designation|description|nom|produit|name|libell[eé]/i
    );
    let colPrice = findHeaderColumn(
      header,
      process.env.DISWAY_COL_PRICE,
      /prix fournisseur|prix promo|prix catalogue|prix|tarif|price|promo|p\.u\.|p\.u\b/i
    );
    const colDispo = findHeaderColumn(
      header,
      process.env.DISWAY_COL_STOCK,
      /disponibilit|stock|dispo|quantit[eé]|qte|qty|reste|available/i
    );
    const colBrand = findHeaderColumn(
      header,
      process.env.DISWAY_COL_BRAND,
      /marque|brand|fabricant|vendor/
    );
    const colCategory = findHeaderColumn(
      header,
      process.env.DISWAY_COL_CATEGORY,
      /categorie|category|famille|family/
    );
    const colDescription = findHeaderColumn(
      header,
      process.env.DISWAY_COL_DESCRIPTION,
      /description|desc|detail|details/
    );

    if (colRef < 0 || colName < 0) {
      skippedSheets.push(`${path.basename(filePath)}:${sheetName}`);
      continue;
    }

    if (colPrice < 0) {
      colPrice = findNumericPriceColumn(raw, headerIdx, header, colName, colDispo);
    }

    const brandFromSheet = brandFromSheetName(sheetName);
    const categoryFromSheet = categoryFromSheetName(sheetName);

    for (let r = headerIdx + 1; r < raw.length; r++) {
      const cells = raw[r];
      const sku = String(cells[colRef] ?? '').trim();
      if (!sku) continue;
      const name = buildName(cells, header, colName);
      if (!name) continue;
      if (
        /^(processeur|memoire|stockage|connectivite|alimentation|dimension|garantie|poids|capacite|format|securite|support)\s/i.test(
          norm(name)
        )
      )
        continue;

      let price = colPrice >= 0 ? toNumber(cells[colPrice]) : null;
      if (price === null && colPrice >= 0 && colPrice + 1 < header.length) {
        const nextTitle = header[colPrice + 1] || '';
        if (!/stock|dispo|quantit|poids|weight|capacit|ref|sku/i.test(nextTitle)) {
          price = toNumber(cells[colPrice + 1]);
        }
      }
      if (price === null) {
        price = extractPriceFromRow(cells, header, colName, colDispo);
      }

      const brandValue = String(cells[colBrand] ?? '').trim();
      const categoryValue = String(cells[colCategory] ?? '').trim();
      const normalizedCategory = normalizeCategoryName(categoryValue);
      const descriptionValue = String(cells[colDescription] ?? '').trim() || null;

      let stock;
      if (colDispo >= 0) {
        const stockVal =
          cells[colDispo] !== undefined && cells[colDispo] !== '' ? cells[colDispo] : 0;
        const stockNum = toNumber(stockVal);
        if (stockNum !== null && stockNum > 0) {
          stock = Math.min(Math.round(stockNum), 99);
        } else {
          const stockText = norm(stockVal);
          const isDispo = /disponible|oui|en stock|^[1-9]/.test(stockText);
          stock = isDispo ? 10 : 0;
        }
      } else {
        stock = 10;
      }

      if (price === null) continue;
      if (price < 5) continue;

      products.push({
        sku,
        name,
        slug: uniqueSlug(slugify(name), usedSlugs),
        description: descriptionValue,
        brandName: brandValue || brandFromSheet || null,
        categoryName:
          normalizedCategory || categoryFromSheet || inferCategoryFromName(name) || 'Composants PC',
        images: [],
        price: price !== null ? Math.round(price * MARKUP * 100) / 100 : 0,
        costPrice: price,
        stock,
        supplier: 'Disway',
        supplierRef: sku,
        isFeatured: false,
        isNew: false,
      });
    }
  }

  if (skippedSheets.length) {
    console.warn('⚠️ Feuilles sans en-tête produit ignorées:', skippedSheets.join(', '));
  }

  return products;
}

function inferCategoryFromName(name) {
  return normalizeCategoryName(name);
}

// ============================================================
// Téléchargement des fichiers
// ============================================================
async function uniqueDownloadPath(baseName) {
  let attempt = 0;
  let filename = baseName;
  let targetPath = path.join(UPLOAD_DIR, filename);
  while (fs.existsSync(targetPath)) {
    attempt += 1;
    const ext = path.extname(baseName) || '.xlsx';
    filename = `${path.basename(baseName, ext)}-${attempt}${ext}`;
    targetPath = path.join(UPLOAD_DIR, filename);
  }
  return targetPath;
}

async function downloadFile(url, targetPath) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ERNETStore/1.0)',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await fsPromises.writeFile(targetPath, buffer);
    return true;
  } catch (err) {
    console.error(`❌ Échec téléchargement ${url}: ${err.message}`);
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function downloadViaPortal() {
  if (!DISWAY_EMAIL || !DISWAY_PASSWORD) {
    console.log('ℹ️ Pas de credentials Disway configurés, skip du portail');
    return [];
  }

  let puppeteer;
  try {
    puppeteer = await import('puppeteer');
  } catch (err) {
    console.warn('⚠️ Puppeteer non disponible, skip du portail:', err.message);
    return [];
  }

  await fsPromises.mkdir(UPLOAD_DIR, { recursive: true });

  let browser = null;
  try {
    browser = await puppeteer.default.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36');

    console.log('🔐 Connexion au portail Disway...');
    await page.goto(DISWAY_LOGIN_URL, { waitUntil: 'networkidle2', timeout: 45000 });

    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });

    await page.type('input[type="email"]', DISWAY_EMAIL);
    await page.type('input[type="password"]', DISWAY_PASSWORD);

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      page
        .evaluate(() => {
          const forms = Array.from(document.querySelectorAll('form'));
          const loginForm =
            forms.find(
              (f) =>
                f.querySelector('input[type="email"]') && f.querySelector('input[type="password"]')
            ) || forms[0];
          const btn = loginForm.querySelector('button[type="submit"], input[type="submit"]');
          if (btn) btn.click();
          else if (loginForm) loginForm.requestSubmit();
        })
        .catch(() => {}),
    ]);

    const loggedIn = await page.evaluate(() => {
      const hasLoginForm = !!document.querySelector('input[type="password"]');
      return !hasLoginForm || /liste-de-prix|account|compte/i.test(location.href);
    });

    if (!loggedIn) {
      console.warn('⚠️ Connexion Disway échouée');
      return [];
    }

    console.log('✅ Connecté au portail Disway');
    await page.goto(DISWAY_PRICE_LIST_URL, { waitUntil: 'networkidle2', timeout: 45000 });

    const downloadLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors
        .map((a) => ({ href: a.href, text: a.textContent || '' }))
        .filter(({ href }) => /\.(xlsx|xls|csv)(\?|$)/i.test(href));
    });

    const files = [];
    const uniqueHrefs = [
      ...new Set(
        downloadLinks
          .filter((item) => /\.(xlsx|xls|csv)(\?|$)/i.test(item.href))
          .map((item) => item.href)
      ),
    ];

    for (const [index, href] of uniqueHrefs.entries()) {
      try {
        const parsedUrl = new URL(href, DISWAY_PRICE_LIST_URL);
        const ext = path.extname(parsedUrl.pathname) || '.xlsx';
        const downloadPath = await uniqueDownloadPath(`disway-portal-${index + 1}${ext}`);

        const page2 = await browser.newPage();
        try {
          const response = await page2.goto(parsedUrl.toString(), {
            waitUntil: 'networkidle2',
            timeout: 45000,
          });
          if (response && response.ok()) {
            const buffer = Buffer.from(await response.arrayBuffer());
            await fsPromises.writeFile(downloadPath, buffer);
            files.push(downloadPath);
            console.log(`📥 Téléchargé: ${path.basename(downloadPath)}`);
          }
        } finally {
          await page2.close().catch(() => {});
        }
      } catch (err) {
        console.warn(`⚠️ Échec téléchargement lien ${href}: ${err.message}`);
      }
    }

    return files;
  } catch (err) {
    console.error('❌ Erreur portail Disway:', err.message);
    return [];
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

async function downloadFromUrls() {
  if (!DISWAY_URLS.length) {
    console.log("ℹ️ Pas d' URLs Disway configurées");
    return [];
  }

  await fsPromises.mkdir(UPLOAD_DIR, { recursive: true });
  const files = [];

  for (const [index, urlString] of DISWAY_URLS.entries()) {
    const filename = `disway-url-${index + 1}.xlsx`;
    const targetPath = path.join(UPLOAD_DIR, filename);

    const success = await downloadFile(urlString, targetPath);
    if (success) {
      files.push(targetPath);
      console.log(`📥 Téléchargé: ${filename}`);
    }
  }

  return files;
}

async function listLocalFiles() {
  try {
    const files = await fsPromises.readdir(UPLOAD_DIR);
    return files
      .filter((file) => /\.(xlsx|xls|csv)$/i.test(file))
      .map((file) => path.join(UPLOAD_DIR, file));
  } catch {
    return [];
  }
}

// ============================================================
// Import en base
// ============================================================
async function importToDatabase(products) {
  const results = { imported: 0, updated: 0, failed: 0 };

  const incomingSkus = products.map((p) => p.sku);
  const existingProducts = await prisma.product.findMany({
    where: { sku: { in: incomingSkus } },
    select: { sku: true },
  });
  const existingSkuSet = new Set(existingProducts.map((p) => p.sku));

  const allDbProducts = await prisma.product.findMany({
    select: { slug: true, sku: true },
  });
  const allDbSlugs = new Map(allDbProducts.filter((p) => p.slug).map((p) => [p.slug, p.sku]));

  for (const p of products) {
    try {
      const data = { ...p };
      let finalSlug = data.slug;

      if (finalSlug) {
        const slugOwnerSku = allDbSlugs.get(finalSlug);
        if (slugOwnerSku && slugOwnerSku !== data.sku) {
          let n = 2;
          let candidate;
          do {
            candidate = `${data.slug}-${n}`;
            n++;
          } while (allDbSlugs.has(candidate));
          finalSlug = candidate;
        }
      }
      data.slug = finalSlug;

      let brand = null;
      if (data.brandName) {
        brand = await prisma.brand.upsert({
          where: { slug: slugify(data.brandName) },
          update: { name: data.brandName },
          create: { name: data.brandName, slug: slugify(data.brandName) },
        });
      }

      let category = null;
      if (data.categoryName) {
        category = await prisma.category.upsert({
          where: { slug: slugify(data.categoryName) },
          update: { name: data.categoryName },
          create: { name: data.categoryName, slug: slugify(data.categoryName) },
        });
      }

      await prisma.product.upsert({
        where: { sku: data.sku },
        update: {
          name: data.name,
          slug: finalSlug,
          description: data.description,
          price: data.price,
          costPrice: data.costPrice,
          stock: data.stock,
          supplier: data.supplier,
          supplierRef: data.supplierRef,
          isFeatured: data.isFeatured,
          isNew: data.isNew,
          brandId: brand?.id,
          categoryId: category?.id,
          lastSyncAt: new Date(),
        },
        create: {
          sku: data.sku,
          name: data.name,
          slug: finalSlug,
          description: data.description,
          price: data.price,
          costPrice: data.costPrice,
          stock: data.stock,
          supplier: data.supplier,
          supplierRef: data.supplierRef,
          isFeatured: data.isFeatured,
          isNew: data.isNew,
          brandId: brand?.id,
          categoryId: category?.id,
          lastSyncAt: new Date(),
        },
      });

      if (finalSlug) allDbSlugs.set(finalSlug, data.sku);

      if (existingSkuSet.has(data.sku)) results.updated++;
      else results.imported++;
    } catch (err) {
      console.error(`❌ Échec import ${p.sku}: ${err.message}`);
      results.failed++;
    }
  }

  return results;
}

// ============================================================
// Logger
// ============================================================
async function writeLog(message) {
  try {
    await fsPromises.mkdir(LOG_DIR, { recursive: true });
    const timestamp = new Date().toISOString().split('T')[0];
    const logFile = path.join(LOG_DIR, `disway-sync-${timestamp}.log`);
    const entry = `[${new Date().toISOString()}] ${message}\n`;
    await fsPromises.appendFile(logFile, entry);
  } catch {}
}

// ============================================================
// Main
// ============================================================
async function main() {
  const startTime = Date.now();
  console.log('='.repeat(60));
  console.log('🔄 ERNET STORE — Synchronisation Disway');
  console.log(`📅 ${new Date().toLocaleString('fr-FR')}`);
  console.log(`💰 Marge Hors Taxe: x${MARKUP}`);
  console.log('='.repeat(60));

  await writeLog('Démarrage de la synchronisation');

  // 1. Collecter les fichiers
  let filePaths = [];

  if (LOCAL_ONLY) {
    console.log('\n📂 Mode local : utilisation des fichiers dans uploads/');
    filePaths = await listLocalFiles();
  } else {
    // Essayer le portail en premier
    const portalFiles = await downloadViaPortal();
    if (portalFiles.length) {
      filePaths.push(...portalFiles);
    }

    // Puis les URLs directes
    const urlFiles = await downloadFromUrls();
    if (urlFiles.length) {
      filePaths.push(...urlFiles);
    }

    // Fallback sur les fichiers locaux
    if (!filePaths.length) {
      console.log('\n📂 Aucun fichier téléchargé, fallback sur les fichiers locaux');
      filePaths = await listLocalFiles();
    }
  }

  if (!filePaths.length) {
    console.error('❌ Aucun fichier de prix trouvé');
    await writeLog('ERREUR: Aucun fichier de prix trouvé');
    process.exitCode = 1;
    return;
  }

  console.log(`\n📊 ${filePaths.length} fichier(s) à traiter`);

  // 2. Parser les fichiers
  const usedSlugs = new Set();
  const allProducts = [];

  for (const filePath of filePaths) {
    console.log(`\n🔍 Traitement: ${path.basename(filePath)}`);
    const products = parseExcelFile(filePath, usedSlugs);
    console.log(`   → ${products.length} produit(s) trouvé(s)`);
    allProducts.push(...products);
  }

  console.log(`\n📦 Total: ${allProducts.length} produit(s)}`);

  if (!allProducts.length) {
    console.error('❌ Aucun produit extrait des fichiers');
    await writeLog('ERREUR: Aucun produit extrait');
    process.exitCode = 1;
    return;
  }

  // Afficher un aperçu
  console.log('\n--- Aperçu des 5 premiers produits ---');
  for (const p of allProducts.slice(0, 5)) {
    console.log(
      `  ${p.sku} | ${p.name.substring(0, 50)} | ${p.costPrice ?? '?'} DH → ${p.price} DH (x${MARKUP})`
    );
  }

  if (DRY_RUN) {
    console.log('\n🏃 Mode dry-run : aucun import en base');
    await writeLog(`Dry-run: ${allProducts.length} produits analysés`);
    return;
  }

  // 3. Optionnel : vider le catalogue
  if (CLEAR_FIRST) {
    console.log('\n🗑️ Suppression du catalogue existant...');
    await prisma.product.deleteMany({});
    await writeLog('Catalogue vidé');
  }

  // 4. Scraping images (optionnel via --images) — AVANT import en base
  if (SCRAPE_IMAGES) {
    console.log('\n🖼️ Scraping des images produit...');
    try {
      await scrapeProductImages(allProducts);
      console.log('✅ Images scrapées avec succès');
    } catch (imgErr) {
      console.warn('⚠️ Scraping images échoué:', imgErr.message);
    }
  }

  // 5. Importer en base
  console.log('\n💾 Import en base de données...');
  const importResults = await importToDatabase(allProducts);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const summary = `Terminé en ${elapsed}s — Importés: ${importResults.imported}, Mis à jour: ${importResults.updated}, Échoués: ${importResults.failed}, Total: ${allProducts.length}`;

  console.log('\n' + '='.repeat(60));
  console.log('✅ ' + summary);
  console.log('='.repeat(60));

  await writeLog(summary);

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ Erreur fatale:', err);
  await writeLog(`FATAL: ${err.message}`);
  await prisma.$disconnect();
  process.exitCode = 1;
});
