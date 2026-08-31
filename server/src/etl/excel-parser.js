// ============================================================
// ERNET STORE — Module ETL : Parseur Excel Haute Performance
// ------------------------------------------------------------
// Supporte :
//  - Formats mixtes (horizontal Dell/HP vs vertical multi-lignes Lenovo)
//  - Extraction et liaison des images ancrées (worksheet.getImages())
//  - Détection dynamique des ruptures et hiérarchie de catégories
//  - Support complet des cellules RichText, Formules et Liens ExcelJS
//  - Application de la marge x1.15 sur prix achat remisé HT
// ============================================================
import ExcelJS from 'exceljs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import env from '../config/env.js';

const MARKUP = Number(env.diswayMarkup || 1.15);

/**
 * Extrait la valeur textuelle brute d'une cellule ExcelJS (gère RichText, formules, objets)
 */
export function getCellValueAsString(cell) {
  if (!cell) return '';
  const val = cell.value !== undefined ? cell.value : cell;
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (val instanceof Date) return val.toISOString();

  // ExcelJS RichText : [{ text: '...' }, { font: ..., text: '...' }]
  if (Array.isArray(val.richText)) {
    return val.richText.map((t) => t.text || '').join('').trim();
  }

  // Hyperlink ou objet texte
  if (typeof val.text === 'string') return val.text.trim();
  if (typeof val.text === 'object' && val.text !== null && Array.isArray(val.text.richText)) {
    return val.text.richText.map((t) => t.text || '').join('').trim();
  }

  // Résultat de formule
  if (val.result !== undefined && val.result !== null) {
    return String(val.result).trim();
  }

  return String(val).trim();
}

/**
 * Nettoie et convertit une valeur brute de prix en nombre décimal
 */
export function cleanNumeric(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === 'number') return isFinite(val) ? val : null;
  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) return cleanNumeric(val.result);
  }

  let cleaned = String(val).trim();
  if (!cleaned) return null;

  // Supprimer les unités ou symboles de devises
  cleaned = cleaned.replace(/[^\d.,-]/g, '').replace(/\s/g, '');
  if (!cleaned) return null;

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  // 1. Présence des deux séparateurs (ex: 12.500,00 ou 12,500.00)
  if (hasComma && hasDot) {
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  }
  // 2. Uniquement des virgules (ex: 12,500 ou 12500,50)
  else if (hasComma) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length === 3 && Number(parts[0]) > 0) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      cleaned = cleaned.replace(/,/g, '.');
    }
  }
  // 3. Uniquement des points (ex: 12.500 ou 1.250.000)
  else if (hasDot) {
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
 * Normalise les chaînes de caractères pour comparaison insensible
 */
export function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Génère un slug propre pour les URLs
 */
export function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * 1. Extraction et sauvegarde des images ancrées par ligne Excel
 */
export async function extractWorksheetImages(worksheet, workbook, outputDir) {
  const imagesByRow = new Map(); // Map<rowNumber, string[]>
  await fs.mkdir(outputDir, { recursive: true });

  const mediaImages = worksheet.getImages();
  for (const imgRef of mediaImages) {
    try {
      const img = workbook.getImage(imgRef.imageId);
      if (!img || !img.buffer) continue;

      // Détermination de la ligne 1-indexée ancrée
      const row = Math.floor(imgRef.range.tl.nativeRow) + 1;
      const ext = img.extension || 'png';
      const filename = `img_${crypto.randomUUID()}.${ext}`;
      const filePath = path.join(outputDir, filename);

      await fs.writeFile(filePath, img.buffer);
      const publicUrl = `/uploads/products/${filename}`;

      if (!imagesByRow.has(row)) {
        imagesByRow.set(row, []);
      }
      imagesByRow.get(row).push(publicUrl);
    } catch (err) {
      console.warn(`[ETL Parser] Erreur extraction image (feuille: ${worksheet.name}):`, err.message);
    }
  }
  return imagesByRow;
}

/**
 * 2. Parseur principal de catalogue Excel B2B
 */
export async function parseCatalogExcel(filePath, imageOutputDir = 'uploads/products') {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const standardizedProducts = [];
  const usedSlugs = new Set();

  for (const worksheet of workbook.worksheets) {
    if (worksheet.rowCount < 2 || worksheet.state === 'hidden') continue;

    console.log(`[ETL Parser] Analyse de l'onglet : "${worksheet.name}" (${worksheet.rowCount} lignes)...`);

    // A. Extraction de la carte des images pour cet onglet
    const rowImagesMap = await extractWorksheetImages(worksheet, workbook, imageOutputDir);

    // B. Contexte d'état pour les ruptures et le multi-lignes
    let currentCategory = worksheet.name;
    let currentSubCategory = '';
    let currentProduct = null;

    // Détection d'en-tête
    let headerRowIdx = -1;
    let colMapping = { sku: -1, name: -1, price: -1, promoPrice: -1, stock: -1, brand: -1, spec: -1 };

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      const rowValues = [];
      row.eachCell((cell, colNumber) => {
        rowValues[colNumber] = getCellValueAsString(cell);
      });
      const rowText = rowValues.map((v) => normalize(v)).join(' ');

      // --- 1. Détection dynamique de la ligne d'en-tête ---
      if (headerRowIdx === -1) {
        if (/ref|sku|code|article/.test(rowText) && /prix|tarif|ht|pu|promo/.test(rowText)) {
          headerRowIdx = rowNumber;
          row.eachCell((cell, colNumber) => {
            const h = normalize(getCellValueAsString(cell));
            if (/ref|sku|code|article/.test(h)) colMapping.sku = colNumber;
            else if (/designation|description|nom|modele|libelle/.test(h)) colMapping.name = colNumber;
            else if (/prix public|prix catalogue|tarif public|p\.u/.test(h)) colMapping.price = colNumber;
            else if (/prix promo|prix achat|remise|net ht|promo|prix b2b/.test(h)) colMapping.promoPrice = colNumber;
            else if (/stock|dispo|quantite|qte|qty/.test(h)) colMapping.stock = colNumber;
            else if (/marque|brand|constructeur|fabriquant/.test(h)) colMapping.brand = colNumber;
            else if (/spec|configuration|caracteristiques/.test(h)) colMapping.spec = colNumber;
          });
          return;
        }
      }

      if (headerRowIdx === -1 || rowNumber <= headerRowIdx) return;

      const firstCell = rowValues[1] || '';
      const skuVal = colMapping.sku > 0 ? rowValues[colMapping.sku] : null;
      const nameVal = colMapping.name > 0 ? rowValues[colMapping.name] : null;
      const priceVal = colMapping.price > 0 ? row.getCell(colMapping.price).value : null;
      const promoVal = colMapping.promoPrice > 0 ? row.getCell(colMapping.promoPrice).value : null;
      const stockVal = colMapping.stock > 0 ? row.getCell(colMapping.stock).value : null;

      const rawCost = cleanNumeric(promoVal) ?? cleanNumeric(priceVal);
      const hasPrice = rawCost !== null && rawCost > 0;
      const hasSku = skuVal && String(skuVal).trim().length >= 3 && !/total|page|promo/i.test(String(skuVal));

      // --- 2. Détection des ruptures de catégories (Lignes Titres / Bannières) ---
      if (!hasPrice && !hasSku) {
        const textBanner = String(firstCell || nameVal || rowValues.find((v) => !!v) || '').trim();
        if (textBanner && textBanner.length > 2 && !/total|page|disway/i.test(textBanner)) {
          if (currentProduct) {
            standardizedProducts.push(currentProduct);
            currentProduct = null;
          }
          currentSubCategory = textBanner;
        }
        return;
      }

      // --- 3. Format Multi-Lignes (Spécifications techniques sous la référence) ---
      if (!hasSku && currentProduct) {
        const specText = String(nameVal || firstCell || '').trim();
        if (specText) {
          if (specText.includes(':')) {
            const [k, ...v] = specText.split(':');
            currentProduct.specs[k.trim()] = v.join(':').trim();
          } else {
            currentProduct.description += ` | ${specText}`;
          }
        }
        if (rowImagesMap.has(rowNumber)) {
          currentProduct.images.push(...rowImagesMap.get(rowNumber));
        }
        return;
      }

      // --- 4. Nouvelle ligne Produit (SKU Principal) ---
      if (currentProduct) {
        standardizedProducts.push(currentProduct);
        currentProduct = null;
      }

      if (hasSku && hasPrice) {
        const sku = String(skuVal).trim();
        const brand = colMapping.brand > 0 && rowValues[colMapping.brand]
          ? String(rowValues[colMapping.brand]).trim()
          : worksheet.name.replace(/Serveurs|Options|Networking/i, '').trim() || 'Disway';

        const costPrice = rawCost;
        const catalogPrice = cleanNumeric(priceVal) || costPrice;
        const finalPrice = Math.round(costPrice * MARKUP * 100) / 100; // Marge x1.15

        let stock = 0;
        const stockNum = cleanNumeric(stockVal);
        if (stockNum !== null) {
          stock = Math.max(0, Math.round(stockNum));
        } else {
          const sText = normalize(colMapping.stock > 0 ? getCellValueAsString(row.getCell(colMapping.stock)) : '');
          stock = /oui|dispo|en stock|[1-9]/.test(sText) ? 10 : 0;
        }

        const images = rowImagesMap.get(rowNumber) || [];
        let baseName = String(nameVal || sku).trim();

        // Nettoyage des préfixes génériques
        if (/^cage\s*\/\s*format/i.test(baseName)) {
          baseName = `${brand} ${sku} - ${baseName.replace(/^cage\s*\/\s*format\s*/i, '').trim()}`;
        }

        let baseSlug = slugify(`${baseName}-${sku}`);
        let slug = baseSlug;
        let counter = 2;
        while (usedSlugs.has(slug)) {
          slug = `${baseSlug}-${counter++}`;
        }
        usedSlugs.add(slug);

        currentProduct = {
          sku,
          brand,
          name: baseName,
          slug,
          category: currentCategory,
          subCategory: currentSubCategory || 'Général',
          costPrice,
          catalogPrice,
          price: finalPrice,
          stock,
          images,
          specs: {},
          description: baseName,
          supplier: 'ERNET STORE Maroc',
          supplierRef: sku,
        };
      }
    });

    // Sauvegarder le dernier produit du bloc
    if (currentProduct) {
      standardizedProducts.push(currentProduct);
    }
  }

  console.log(`[ETL Parser] Total extrait : ${standardizedProducts.length} produits standardisés.`);
  return standardizedProducts;
}
