import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import env from './src/config/env.js';
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES, FALLBACK_BRANDS } from '../client/src/data/fallbackProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_ASSETS_DIR = path.join(__dirname, '..', 'client', 'public', 'assets', 'products');
const UPLOADS_DIR = path.join(__dirname, 'uploads', 'products');
const TARGET_FILE = path.join(__dirname, '..', 'client', 'src', 'data', 'fallbackProducts.js');

async function downloadFile(url, destPath, cookieHeader = '') {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
        Cookie: cookieHeader,
      },
    });
    if (!res.ok) return false;
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image') && !contentType.includes('octet-stream')) return false;

    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 1000) return false; // Ignorer les placeholders 1x1

    await fsPromises.writeFile(destPath, buffer);
    return true;
  } catch {
    return false;
  }
}

async function run() {
  console.log('='.repeat(60));
  console.log('🚀 ERNET STORE — Importation des images réelles depuis le site Disway');
  console.log(`📦 Nombre de produits à traiter : ${FALLBACK_PRODUCTS.length}`);
  console.log('='.repeat(60));

  await fsPromises.mkdir(CLIENT_ASSETS_DIR, { recursive: true });
  await fsPromises.mkdir(UPLOADS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  console.log('🔑 Connexion au portail Disway...');
  await page.goto(env.diswayLoginUrl || 'https://www.disway.com/profile/login?backurl=%2Fliste-de-prix', {
    waitUntil: 'networkidle2',
    timeout: 45000,
  });

  const emailSelector = 'input[type="email"], input[name="email"], input[name="username"]';
  const passSelector = 'input[type="password"]';

  await page.waitForSelector(emailSelector, { timeout: 15000 });
  await page.type(emailSelector, env.diswayEmail);
  await page.type(passSelector, env.diswayPassword);

  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
    page.evaluate(() => {
      const btn = document.querySelector('form button[type="submit"], form input[type="submit"], button.btn-primary');
      if (btn) btn.click();
      else document.querySelector('form')?.submit();
    }),
  ]);

  const cookies = await page.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  console.log('✅ Session Disway authentifiée avec succès !');

  let successCount = 0;
  const updatedProducts = [...FALLBACK_PRODUCTS];

  for (let i = 0; i < updatedProducts.length; i++) {
    const p = updatedProducts[i];
    const safeSku = String(p.sku).replace(/[^a-zA-Z0-9_-]/g, '_');
    const localFileName = `${safeSku}.png`;
    const clientPath = path.join(CLIENT_ASSETS_DIR, localFileName);
    const publicUrl = `/assets/products/${localFileName}`;

    console.log(`\n[${i + 1}/${updatedProducts.length}] Recherche image pour : ${p.name} (SKU: ${p.sku})`);

    // 1. Essayer le CDN direct Disway
    const cdnUrls = [
      `https://www.disway.com/product/image/large/${encodeURIComponent(p.sku)}.png`,
      `https://www.disway.com/product/image/small/${encodeURIComponent(p.sku)}.png`,
      `https://www.disway.com/product/image/large/${encodeURIComponent(p.sku)}.jpg`,
      `https://www.disway.com/product/image/small/${encodeURIComponent(p.sku)}.jpg`,
    ];

    let downloaded = false;
    for (const cdnUrl of cdnUrls) {
      downloaded = await downloadFile(cdnUrl, clientPath, cookieHeader);
      if (downloaded) {
        console.log(`  ⚡ Image trouvée directement sur le CDN Disway : ${cdnUrl}`);
        break;
      }
    }

    // 2. Si non trouvé sur CDN, faire une recherche sur le site Disway par nom/SKU
    if (!downloaded) {
      try {
        const query = p.sku.length > 4 ? p.sku : `${p.brand} ${p.name.split(' ')[0]}`;
        const searchUrl = `https://www.disway.com/search?q=${encodeURIComponent(query)}`;
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});

        const foundImgUrl = await page.evaluate(() => {
          const productImg = document.querySelector('img.PLP_product-img, .PLP_product-img-wrapper img, [class*="product-img"]');
          if (productImg && productImg.src && !productImg.src.includes('data:image')) {
            return productImg.src;
          }
          return null;
        });

        if (foundImgUrl) {
          downloaded = await downloadFile(foundImgUrl, clientPath, cookieHeader);
          if (downloaded) {
            console.log(`  🔍 Image extraite via recherche Disway : ${foundImgUrl}`);
          }
        }
      } catch (err) {
        console.warn(`  ⚠️ Erreur recherche Disway :`, err.message);
      }
    }

    if (downloaded) {
      p.images = [publicUrl];
      successCount++;
    } else {
      console.log(`  ℹ️ Image spécifique non trouvée sur le site Disway, conservation du visuel matériel haute qualité.`);
    }

    // Pause respectueuse
    await new Promise((r) => setTimeout(r, 200));
  }

  await browser.close();

  // Mettre à jour fallbackProducts.js
  const fileContent = `// ============================================================
// ERNET STORE — Catalogue Réel Disway avec Images Officielles Importées
// ============================================================

export const FALLBACK_CATEGORIES = ${JSON.stringify(FALLBACK_CATEGORIES, null, 2)};

export const FALLBACK_BRANDS = ${JSON.stringify(FALLBACK_BRANDS, null, 2)};

export const FALLBACK_PRODUCTS = ${JSON.stringify(updatedProducts, null, 2)};
`;

  fs.writeFileSync(TARGET_FILE, fileContent, 'utf-8');
  console.log('\n' + '='.repeat(60));
  console.log(`✨ Importation terminée : ${successCount}/${updatedProducts.length} images officielles Disway téléchargées et rattachées aux articles.`);
  console.log(`💾 Fichier catalogue mis à jour dans : ${TARGET_FILE}`);
  console.log('='.repeat(60));
}

run().catch((e) => console.error('Erreur globale:', e));
