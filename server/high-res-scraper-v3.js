import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import puppeteer from 'puppeteer';

const fallbackFile = path.resolve('../client/src/data/fallbackProducts.js');
const imgDir = path.resolve('../client/public/uploads/products');

if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return downloadImage(response.headers.location, filepath).then(resolve).catch(reject);
            }
            if (response.statusCode === 200) {
                const file = fs.createWriteStream(filepath);
                response.pipe(file);
                file.on('finish', () => file.close(resolve));
            } else {
                reject(new Error(`Status ${response.statusCode}`));
            }
        });
        
        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.abort();
            reject(new Error("Timeout"));
        });
    });
};

const getSearchQuery = (p) => {
    let cleanName = p.name.replace(/[^a-zA-Z0-9 -]/g, ' ').replace(/\s+/g, ' ').trim();
    if (p.brand === 'Microsoft' && p.name.includes('CLOUD')) {
        return "Microsoft Azure Cloud Solution Software IT";
    }
    if (p.brand === 'Microsoft' && p.name.includes('Office')) {
        return "Microsoft Office Box IT Software";
    }
    if (p.brand === 'Microsoft' && p.name.includes('Windows')) {
        return "Microsoft Windows Server Box Software IT";
    }
    if (p.brand === 'BLUEMEGA' && p.name.includes('Toner')) {
        return `HP Toner Cartridge IT hardware ${cleanName.substring(0, 25)}`;
    }
    if (p.brand === 'BLUEMEGA' && p.name.includes('Imprimante')) {
        return `TROY MICR Printer IT hardware`;
    }
    if (p.brand === 'OEM' || p.brand === 'JINKO SOLAR') {
         return `${p.brand} ${cleanName.substring(0, 40)}`;
    }
    return `${p.brand} ${cleanName.substring(0, 30)} ${p.sku}`.substring(0, 80);
};

(async () => {
    console.log("Reading fallbackProducts.js...");
    const content = fs.readFileSync(fallbackFile, 'utf8');
    
    let jsCode = content.replace(/export const /g, 'global.');
    jsCode = jsCode.replace(/import .*;?\n/g, '');
    eval(jsCode);
    
    const items = global.FALLBACK_PRODUCTS;
    const browser = await puppeteer.launch({ headless: true });
    
    for (let i = 0; i < items.length; i++) {
        const p = items[i];
        
        // Skip items that already have a real Excel image
        const currentImg = (p.images && p.images[0]) || '';
        if (!currentImg.startsWith('https://images.unsplash.com')) {
             continue;
        }

        const query = getSearchQuery(p);
        console.log(`[${i+1}/${items.length}] Bing High-Res for: ${query}`);
        
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (['stylesheet', 'font', 'media'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.goto(`https://www.bing.com/images/search?q=${encodeURIComponent(query)}&form=HDRSC3`, { waitUntil: 'domcontentloaded' });
            await page.waitForSelector('.iusc', { timeout: 8000 }).catch(() => {});
            
            const urls = await page.evaluate(() => {
                const results = [];
                const nodes = document.querySelectorAll('.iusc');
                for (const item of nodes) {
                    const m = item.getAttribute('m');
                    if (m) {
                        try {
                            const parsed = JSON.parse(m);
                            if (parsed.murl && parsed.murl.startsWith('http')) results.push(parsed.murl);
                        } catch (e) {}
                    }
                }
                return results;
            });
            
            await page.close();
            
            let downloaded = false;
            if (urls && urls.length > 0) {
                const imgPath = path.join(imgDir, `${p.sku}.jpg`);
                
                for (let j = 0; j < Math.min(5, urls.length); j++) {
                    try {
                        await downloadImage(urls[j], imgPath);
                        const stats = fs.statSync(imgPath);
                        if (stats.size > 8000) { 
                            console.log(` => Downloaded HIGH RES for ${p.sku} from ${urls[j]}`);
                            // Update the item
                            p.images = [`/uploads/products/${p.sku}.jpg`];
                            downloaded = true;
                            break;
                        }
                    } catch (e) { }
                }
            }
            
            if (!downloaded) {
                console.log(` => Failed to download high res for ${p.sku}`);
            }
        } catch (err) {
            console.error(` => Error processing ${p.sku}: ${err.message}`);
        }
    }
    
    await browser.close();
    
    // Write back updated items to fallbackProducts.js
    let outJs = `// ============================================================\n`;
    outJs += `// ERNET STORE - Catalogue avec Images Excel + Scraped HD\n`;
    outJs += `// ============================================================\n\n`;
    outJs += `export const FALLBACK_PRODUCTS = ${JSON.stringify(items, null, 2)};\n`;
    fs.writeFileSync(fallbackFile, outJs, 'utf8');
    
    console.log("High Res Download Done & JSON Updated!");
})();
