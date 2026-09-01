import fs from 'fs';
import path from 'path';
import https from 'https';
import puppeteer from 'puppeteer';

const fallbackFile = path.resolve('../client/src/data/fallbackProducts.js');
const imgDir = path.resolve('../client/public/assets/products');

if (!fs.existsSync(imgDir)) {
    fs.mkdirSync(imgDir, { recursive: true });
}

const downloadImage = (url, filepath) => {
    return new Promise((resolve, reject) => {
        // Ensure subdirectories exist if SKU contains a slash
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close(resolve);
                });
            } else {
                reject(new Error(`Server responded with ${response.statusCode}`));
            }
        }).on('error', (err) => {
            fs.unlink(filepath, () => reject(err));
        });
    });
};

(async () => {
    console.log("Reading fallbackProducts.js...");
    const content = fs.readFileSync(fallbackFile, 'utf8');
    
    let jsCode = content.replace(/export const /g, 'global.');
    jsCode = jsCode.replace(/import .*;?\n/g, '');
    
    try {
        eval(jsCode);
    } catch (e) {
        console.error("Failed to eval:", e);
        return;
    }
    
    const items = global.FALLBACK_PRODUCTS;
    const browser = await puppeteer.launch({ headless: true });
    
    // Start from index 65 (since 66 crashed)
    for (let i = 65; i < items.length; i++) {
        const p = items[i];
        const query = `${p.brand} ${p.name} ${p.sku}`.substring(0, 100);
        console.log(`[${i+1}/${items.length}] Searching for: ${query}`);
        
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
            await page.waitForSelector('img.mimg', { timeout: 8000 });
            
            const imgSrc = await page.evaluate(() => {
                const imgs = document.querySelectorAll('img.mimg');
                for (const img of imgs) {
                    const src = img.src || img.getAttribute('data-src') || img.getAttribute('src');
                    if (src && src.startsWith('http') && !src.includes('base64')) {
                        return src;
                    }
                }
                return null;
            });
            
            await page.close();
            
            if (imgSrc) {
                const imgPath = path.join(imgDir, `${p.sku}.jpg`);
                await downloadImage(imgSrc, imgPath);
                console.log(` => Downloaded image for ${p.sku}`);
            } else {
                console.log(` => No image found for ${p.sku}`);
            }
        } catch (err) {
            console.error(` => Error processing ${p.sku}: ${err.message}`);
        }
    }
    
    await browser.close();
    console.log("Done!");
})();
