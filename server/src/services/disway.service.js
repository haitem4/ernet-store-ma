// ============================================================
// ERNET STORE — Service d'import des tarifs FOURNISSEUR (Disway)
// ------------------------------------------------------------
// Rôle : télécharger/parser le fichier Excel Disway mensuel,
// appliquer la marge de bénéfice (×1.5 par défaut) sur chaque
// produit, puis synchroniser le catalogue via sync.service.js
//
// Trois modes de récupération du fichier (testés dans l'ordre) :
//   1. Connexion au portail Disway via Puppeteer (DISWAY_EMAIL/PASSWORD)
//   2. URL directe (DISWAY_XLSX_URL) — téléchargement automatique
//   3. Fichier local placé dans server/uploads/latest.xlsx
// ============================================================
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';
import puppeteer from 'puppeteer';
import env from '../config/env.js';
import { bulkImport, clearProductCatalog, rebuildSearchIndex } from './sync.service.js';
import { scrapeProductImages } from './disway.images.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
const DEFAULT_LOCAL_FILE = path.join(UPLOAD_DIR, 'latest.xlsx');

async function listLocalPriceFiles() {
  try {
    const files = await fsPromises.readdir(UPLOAD_DIR);
    return files
      .filter((file) => /\.(xlsx|xls|csv)$/i.test(file))
      .map((file) => path.join(UPLOAD_DIR, file));
  } catch {
    return [];
  }
}

// Marge de bénéfice : prix_public = tarif_fournisseur_remisé_HT × MARKUP (1.15 = +15%)
const MARKUP = env.diswayMarkup ?? 1.15;

/**
 * Convertit une valeur Excel en nombre valide (gère virgules, espaces, €/DH).
 */
function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return isFinite(value) ? value : null;

  if (/^\d+\s*(to|tb|go|gb|mo|mb|ko|kb)$/i.test(String(value).trim())) return null;

  let cleaned = String(value).trim();
  if (!cleaned) return null;

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

/**
 * Cherche l'index d'une colonne dans l'en-tête en utilisant le mapping/env
 * ou un motif par défaut.
 */
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
    if (/stock|dispo|quantit[eé]|qte|qty|reste|unit[eé]?|pu|u\/n|poids|weight/i.test(title))
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

function extractPriceFromRow(cells, header, colName, _colDispo) {
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
  if (/\b(destockage|promotion|solde)\b/.test(s)) return 'Destockage';

  return null;
}

function inferCategoryFromName(name) {
  return normalizeCategoryName(name);
}

/**
 * Se connecte au portail Disway via un navigateur headless (Puppeteer)
 * et télécharge le fichier de prix Excel. Retourne null si impossible.
 */
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

async function downloadFileWithCookies(url, cookies, targetPath) {
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
      Cookie: cookieHeader,
      Referer: env.diswayPriceListUrl || 'https://www.disway.com/liste-de-prix',
      Accept: '*/*',
    },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
      headless: 'new',
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36');

    // 1. Page de connexion
    await page.goto(env.diswayLoginUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    // Attendre les champs email / mot de passe (sélecteurs génériques)
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.waitForSelector('input[type="password"]', { timeout: 15000 });

    // Remplir le formulaire de connexion
    await page.type('input[type="email"]', env.diswayEmail);
    await page.type('input[type="password"]', env.diswayPassword);

    // Soumettre en ciblant le formulaire qui contient email+password
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
          if (btn) {
            btn.click();
          } else if (loginForm) {
            loginForm.requestSubmit();
          }
        })
        .catch(() => {}),
    ]);

    // Vérifier si la connexion a réussi
    const loggedIn = await page.evaluate(() => {
      const hasLoginForm = !!document.querySelector('input[type="password"]');
      return !hasLoginForm || /liste-de-prix|account|compte/i.test(location.href);
    });
    if (!loggedIn) {
      console.warn('⚠️ Disway: la connexion semble avoir échoué');
      return null;
    }

    // 2. Naviguer vers la liste de prix
    await page.goto(env.diswayPriceListUrl, { waitUntil: 'networkidle2', timeout: 45000 });

    const downloadLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
        .map((a) => ({ href: a.href, text: a.textContent || '' }))
        .filter(
          ({ href, text }) =>
            /\.(xlsx|xls|csv)(\?|$)/i.test(href) ||
            /voir le fichier|t[eé]l[eé]charger|export|excel|download/i.test(text)
        );
    });

    const cookies = await page.cookies();
    const uniqueHrefs = [
      ...new Set(
        downloadLinks
          .filter((item) => /\.(xlsx|xls|csv)(\?|$)/i.test(item.href))
          .map((item) => item.href)
      ),
    ];

    for (const [index, href] of uniqueHrefs.entries()) {
      try {
        const parsedUrl = new URL(href, env.diswayPriceListUrl);
        const ext = path.extname(parsedUrl.pathname) || '.xlsx';
        const downloadPath = await uniqueDownloadPath(`disway-link-${index + 1}${ext}`);
        await downloadFileWithCookies(parsedUrl.toString(), cookies, downloadPath);
        files.push(downloadPath);
        console.log(`📥 Fichier Disway téléchargé avec succès : ${path.basename(downloadPath)}`);
      } catch (err) {
      }
    }

    if (files.length) {
      return files;
    }

    // 4. Fallback : lire la page HTML pour trouver un lien d'export.
    const directUrl = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const match = links.find(
        (a) =>
          /\.(xlsx|xls|csv)(\?|$)/i.test(a.href) || /export|download/i.test(a.textContent || '')
      );
      return match?.href || null;

      try {
        const parsed = new URL(directUrl, env.diswayPriceListUrl);
        const downloadPath = await uniqueDownloadPath(`disway-1${ext}`);
        await downloadWithBrowserPage(browser, parsed.toString(), downloadPath);
        return [downloadPath];
      } catch (err) {
        console.warn('⚠️ Disway téléchargement direct échoué:', err.message);
      }
    }

    return [];
  } catch (err) {
    console.warn('⚠️ Disway connexion portail échouée:', err.message);
    return null;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

/**
 * Télécharge le fichier Excel depuis l'URL configurée (si dispo).
 * NB : si Disway protège l'accès par login, ce téléchargement peut
 * échouer ; on retombe alors sur le fichier local.
 */
async function downloadFromUrl() {
  if (!Array.isArray(env.diswayXlsxUrls) || !env.diswayXlsxUrls.length) return [];
  await fsPromises.mkdir(UPLOAD_DIR, { recursive: true });

  const savedFiles = [];
  for (const [index, urlString] of env.diswayXlsxUrls.entries()) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const url = new URL(urlString);
      const res = await fetch(url.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ERNETStore/1.0)',
        },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const ext = path.extname(url.pathname) || '.xlsx';
      const downloadPath = await uniqueDownloadPath(`disway-url-${index + 1}${ext}`);
      await fsPromises.writeFile(downloadPath, buffer);
      savedFiles.push(downloadPath);
    } catch (err) {
      console.warn('⚠️ Disway téléchargement par URL échoué pour', urlString, err.message);
    } finally {
      clearTimeout(timeout);
    }
  }

  return savedFiles;
}

/**
 * Normalise une chaîne pour comparaison (minuscules, sans accents).
 */
function norm(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Construit un nom produit lisible et aussi unique que possible à partir de la
 * colonne "Désignation/Description" (headée par `colName`). Pour éviter les
 * libellés génériques répétés (ex. "Cage / Format"), on enrichit le nom avec la
 * colonne descriptive suivante (le "format"/détail), à condition qu'elle ne
 * soit pas une colonne numérique (prix / stock / dispo).
 */
function buildName(cells, header, colName, sku = '', brand = '') {
  let name = String(cells[colName] ?? '').trim();
  if (!name) return '';
  // Si le nom commence par "Cage / Format", on ajoute la marque et le SKU pour un titre clair
  if (/^cage\s*\/\s*format/i.test(name)) {
    name = `${brand ? brand + ' ' : ''}${sku} - ${name.replace(/^cage\s*\/\s*format\s*/i, '').trim()}`.trim();
  }
  // Colonne descriptive suivante => souvent le "format" ou complément de nom.
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

/**
 * Rend un slug unique au sein d'un lot en ajoutant un suffixe si collision.
 */
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

/**
 * Cherche l'index de la ligne d'en-tête au sein d'un bloc de lignes brutes.
 * La ligne d'en-tête Disway contient typiquement "Référence" et un mot prix.
 */
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
  return 1; // fallback
}

/**
 * Déduit une marque canonique à partir du nom d'une feuille Disway.
 */
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
  return null;
}

/**
 * Déduit une catégorie à partir du nom de la feuille.
 */
function categoryFromSheetName(sheetName) {
  const normalized = normalizeCategoryName(sheetName);
  if (normalized) return normalized;

  const s = norm(sheetName);
  if (/synolog|nas|stockage|destockage/.test(s)) return 'Stockage';
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

/**
 * Lit et parse le fichier Excel (XLSX) en tableau de produits.
 * Gère l'export Disway multi-feuilles : chaque feuille contient des
 * titres, une ligne d'en-tête ("Référence / Désignation / Prix...")
 * puis des lignes produits. On agrège toutes les feuilles utiles.
 */
export async function parseDiswayFile({ localOnly = false } = {}) {
  const filePathSet = new Set();

  if (!localOnly) {
    const portalFiles = await downloadViaPortal();
    if (portalFiles && portalFiles.length) {
      portalFiles.forEach((file) => filePathSet.add(path.resolve(file)));
    }

    const urlFiles = await downloadFromUrl();
    if (urlFiles && urlFiles.length) {
      urlFiles.forEach((file) => filePathSet.add(path.resolve(file)));
    }
  }

  if (filePathSet.size === 0) {
    if (fs.existsSync(DEFAULT_LOCAL_FILE)) {
      filePathSet.add(path.resolve(DEFAULT_LOCAL_FILE));
    }

    const localFiles = await listLocalPriceFiles();
    for (const file of localFiles) {
      filePathSet.add(path.resolve(file));
    }
  }

  if (filePathSet.size === 0) {
    throw new Error(
      'Fichier Disway introuvable. Placez un ou plusieurs fichiers Excel dans server/uploads/ ' +
        'ou configurez DISWAY_XLSX_URL dans le fichier .env.'
    );
  }

  const products = [];
  const skippedSheets = [];
  const usedSlugs = new Set();

  for (const filePath of filePathSet) {
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

      // Identifier les colonnes par leur position (les en-têtes Disway sont en colonnes A..F)
      const colRef = findHeaderColumn(
        header,
        env.diswayColSku,
        /ref|sku|code|article|product ?number|r[eé]f[eé]rence/
      );
      const colName = findHeaderColumn(
        header,
        env.diswayColName,
        /d[eé]signation|designation|description|nom|produit|name|libell[eé]/i
      );
      let colPrice = findHeaderColumn(
        header,
        env.diswayColPrice,
        /prix fournisseur|prix promo|prix catalogue|prix|tarif|price|promo|p\.u\.|p\.u\b/i
      );
      const colDispo = findHeaderColumn(
        header,
        env.diswayColStock,
        /disponibilit|stock|dispo|quantit[eé]|qte|qty|reste|available/i
      );
      const colBrand = findHeaderColumn(
        header,
        env.diswayColBrand,
        /marque|brand|fabricant|vendor/
      );
      const colCategory = findHeaderColumn(
        header,
        env.diswayColCategory,
        /categorie|category|famille|family/
      );
      const colDescription = findHeaderColumn(
        header,
        env.diswayColDescription,
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
        const brandValue = String(cells[colBrand] ?? '').trim();
        const name = buildName(cells, header, colName, sku, brandValue || brandFromSheet);
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
            normalizedCategory ||
            categoryFromSheet ||
            inferCategoryFromName(name) ||
            'Composants PC',
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
  }

  if (skippedSheets.length) {
    console.warn('⚠️ Disway: feuilles sans en-tête produit ignorées:', skippedSheets.join(', '));
  }

  return products;
}

/**
 * Import complet : parse + applique la marge + synchronise le catalogue.
 */
export async function syncDiswayCatalog(options = {}) {
  if (options.clearExisting) {
    await clearProductCatalog();
  }

  const products = await parseDiswayFile(options);
  if (!products.length) {
    return {
      imported: 0,
      updated: 0,
      failed: 0,
      total: 0,
      message: 'Aucun produit trouvé dans le fichier',
    };
  }

  try {
    await scrapeProductImages(products);
  } catch (imgErr) {
    console.warn('⚠️ Scraping images échoué:', imgErr.message);
  }

  const result = await bulkImport(products);
  const indexed = await rebuildSearchIndex();

  return { ...result, total: products.length, markup: MARKUP, indexed };
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default { syncDiswayCatalog, parseDiswayFile };
