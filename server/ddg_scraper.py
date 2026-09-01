import json
import os
import re
import requests
from duckduckgo_search import DDGS

img_dir = '../client/public/assets/products'
if not os.path.exists(img_dir):
    os.makedirs(img_dir)

def clean_text(text):
    return re.sub(r'[^a-zA-Z0-9 \-]', ' ', text).strip()

def get_query(p):
    brand = p.get('brand', '')
    name = clean_text(p.get('name', ''))
    sku = clean_text(p.get('sku', ''))
    
    if brand == 'Microsoft' and 'CLOUD' in name:
        return "Microsoft Azure Cloud logo"
    if brand == 'Microsoft' and 'Office' in name:
        return "Microsoft Office Box"
    if brand == 'BLUEMEGA' and 'Toner' in name:
        return f"HP Toner Cartridge box {name[:20]}"
    if brand == 'BLUEMEGA' and 'Imprimante' in name:
        return f"TROY MICR Printer"
    
    # Strictly focus on IT hardware, limit characters so DDG doesn't get confused
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
            if size > 10000: # Ensure valid image > 10KB
                return True
            os.remove(filepath)
    except Exception:
        pass
    return False

with open('products.json', 'r', encoding='utf-8') as f:
    items = json.load(f)

ddgs = DDGS()
for i, p in enumerate(items):
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
                downloaded = True
                break
        if not downloaded:
            print(" => FAILED to download a valid image")
    except Exception as e:
        print(f" => Error: {e}")

print("Python DDG Scraper done!")
