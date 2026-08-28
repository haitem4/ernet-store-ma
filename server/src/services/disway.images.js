// ============================================================
// ERNET STORE — Service de scraping d'images Disway (Puppeteer)
// ============================================================
// Pour chaque produit importé, navigue vers la fiche Disway,
// récupère l'image principale et la sauvegarde en local.
// ============================================================
import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGE_DIR = path.join(__dirname, '..', '..', env.diswayImageDir || 'uploads/products');
const BASE_URL = env.diswayImageBase || 'https://www.disway.com';
const CONCURRENCY = env.diswayImageConcurrency || 3;
const SELECTORS = (
  env.diswayImageSelectors || 'img.product-image, img[data-src], .product-detail img'
)
  .split(',')
  .map((s) => s.trim());

/**
 * Retourne le chemin local d'une image produit à partir de son SKU.
 */
function imagePathFor(sku) {
  const safe = String(sku).replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(IMAGE_DIR, `${safe}.jpg`);
}

/**
 * Vérifie si une image existe déjà en local pour ce SKU.
 */
function imageExists(sku) {
  return fs.existsSync(imagePathFor(sku));
}

/**
 * Télécharge une image depuis une URL et la sauvegarde en local.
 */
async function downloadImage(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  await fsPromises.writeFile(destPath, buffer);
}

/**
 * Ouvre un navigateur Puppeteer et scrape l'image d'un produit Disway.
 * Retourne le chemin local relatif si succès, null sinon.
 */
async function scrapeOneProduct(page, product) {
  const sku = product.sku || product.supplierRef;
  if (!sku) return null;

  const destPath = imagePathFor(sku);
  if (imageExists(sku)) return `/uploads/products/${path.basename(destPath)}`;

  // Construire l'URL de recherche Disway
  const searchUrl = `${BASE_URL}/search?q=${encodeURIComponent(product.name || sku)}`;

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForSelector('img', { timeout: 8000 }).catch(() => {});

    // Chercher une image produit pertinente
    const imageUrl = await page.evaluate((selectors) => {
      // 1. Essayer les sélecteurs configurés
      for (const sel of selectors) {
        const img = document.querySelector(sel);
        if (img) {
          const src = img.getAttribute('src') || img.getAttribute('data-src');
          if (src && src.startsWith('http')) return src;
        }
      }
      // 2. Fallback : première image produit logique
      const allImgs = Array.from(document.querySelectorAll('img'));
      const productImg = allImgs.find((img) => {
        const src = img.getAttribute('src') || '';
        return (
          /product|item|media|cdn.*\.(jpg|jpeg|png|webp)/i.test(src) &&
          !/logo|icon|banner|svg|placeholder/i.test(src)
        );
      });
      if (productImg) {
        return productImg.getAttribute('src') || productImg.getAttribute('data-src') || null;
      }
      // 3. Dernier recours : première image non-svg
      const fallback = allImgs.find((img) => {
        const src = img.getAttribute('src') || '';
        return src.startsWith('http') && !/\.svg/i.test(src);
      });
      return fallback ? fallback.getAttribute('src') || null : null;
    }, SELECTORS);

    if (imageUrl) {
      await downloadImage(imageUrl, destPath);
      return `/uploads/products/${path.basename(destPath)}`;
    }
  } catch {
    // Silencieux — on ne bloque pas pour une image
  }
  return null;
}

/**
 * Scrape les images d'un lot de produits avec concurrence limitée.
 * Met à jour les produits avec le chemin local de l'image si trouvé.
 */
export async function scrapeProductImages(products) {
  if (!products || !products.length) return;

  await fsPromises.mkdir(IMAGE_DIR, { recursive: true });

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120 Safari/537.36');
    await page.setViewport({ width: 1280, height: 800 });

    // Filtrer les produits sans image
    const toScrape = products.filter(
      (p) => (!p.images || p.images.length === 0) && (p.sku || p.supplierRef)
    );
    let scraped = 0;

    // Traitement par lots avec concurrence limitée
    for (let i = 0; i < toScrape.length; i += CONCURRENCY) {
      const batch = toScrape.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((product) => scrapeOneProduct(page, product))
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        if (result.status === 'fulfilled' && result.value) {
          toScrape[i + j].images = [result.value];
          scraped++;
        }
      }

      if (i + CONCURRENCY < toScrape.length) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    console.log(`🖼️ ${scraped}/${toScrape.length} images récupérées`);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
}

export default { scrapeProductImages };
