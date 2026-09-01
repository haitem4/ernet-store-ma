import json
import os
import re
import requests
from duckduckgo_search import DDGS

img_dir = '../client/public/uploads/products'
if not os.path.exists(img_dir):
    os.makedirs(img_dir)

def clean_text(text):
    return re.sub(r'[^a-zA-Z0-9 \-]', ' ', text).strip()

def get_query(p):
    brand = p.get('brand', '')
    name = clean_text(p.get('name', ''))
    sku = clean_text(p.get('sku', ''))
    
    if brand == 'Microsoft' and 'CLOUD' in name:
        return "Microsoft Azure Cloud logo HD"
    if brand == 'Microsoft' and 'Office' in name:
        return "Microsoft Office Box"
    if brand == 'BLUEMEGA' and 'Toner' in name:
        return f"HP Toner Cartridge box {name[:20]}"
    if brand == 'BLUEMEGA' and 'Imprimante' in name:
        return f"TROY MICR Printer"
    
    return f"{brand} {sku} {name[:30]} IT hardware"

def download_image(url, filepath):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        r = requests.get(url, headers=headers, timeout=5)
        if r.status_code == 200:
            os.makedirs(os.path.dirname(filepath), exist_ok=True)
            with open(filepath, 'wb') as f:
                f.write(r.content)
            size = os.path.getsize(filepath)
            if size > 10000:
                return True
            os.remove(filepath)
    except Exception:
        pass
    return False

# Re-export the newly generated fallbackProducts.js
import subprocess
subprocess.run(['node', '-e', "const fs = require('fs'); const content = fs.readFileSync('../client/src/data/fallbackProducts.js', 'utf8'); eval(content.replace(/export const /g, 'global.').replace(/import .*;?\\n/g, '')); fs.writeFileSync('products.json', JSON.stringify(global.FALLBACK_PRODUCTS));"], check=True)

with open('products.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

ddgs = DDGS()
for i, p in enumerate(items):
    # Only scrape if it doesn't have a real Excel image
    img_url = p.get('images', [''])[0]
    if not img_url.startswith('https://images.unsplash.com'):
        continue
        
    sku = p['sku']
    query = get_query(p)
    print(f"[{i+1}/{len(items)}] DDG Search: {query}")
    
    filepath = os.path.join(img_dir, f"{sku}.jpg")
    
    try:
        results = list(ddgs.images(query, max_results=4, safesearch="on"))
        downloaded = False
        for res in results:
            if download_image(res['image'], filepath):
                print(f" => Downloaded: {res['image']}")
                
                # Update JSON data to point to new image
                p['images'] = [f"/uploads/products/{sku}.jpg"]
                downloaded = True
                break
        if not downloaded:
            print(" => FAILED to download a valid image")
    except Exception as e:
        print(f" => Error: {e}")

# Write back to fallbackProducts.js
js_content = "// ============================================================\n"
js_content += "// ERNET STORE - Catalogue R\u00e9el avec Images Excel & Scraped\n"
js_content += "// ============================================================\n\n"
js_content += "export const FALLBACK_PRODUCTS = " + json.dumps(items, indent=2) + ";\n"

with open('../client/src/data/fallbackProducts.js', 'w', encoding='utf-8') as f:
    f.write(js_content)

print("Python DDG Scraper done!")
