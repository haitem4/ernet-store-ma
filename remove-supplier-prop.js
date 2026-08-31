import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = path.join(__dirname, 'client', 'src', 'data', 'fallbackProducts.js');

let content = fs.readFileSync(TARGET_FILE, 'utf-8');
content = content.replace(/\s*"supplier":\s*"[^"]*",?\n?/g, '\n');

fs.writeFileSync(TARGET_FILE, content, 'utf-8');
console.log('✅ Propriété supplier supprimée de fallbackProducts.js.');
