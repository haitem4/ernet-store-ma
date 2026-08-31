import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = path.join(__dirname, 'client', 'src', 'data', 'fallbackProducts.js');

let content = fs.readFileSync(TARGET_FILE, 'utf-8');

// Remplacements globaux pour supprimer toute mention publique de Disway
content = content.replaceAll('"Disway Maroc Officiel"', '"Produit Neuf & Certifié Maroc"');
content = content.replaceAll('"Disway Officiel"', '"ERNET STORE Maroc"');
content = content.replaceAll('"Disway B2B"', '"ERNET STORE Maroc"');
content = content.replaceAll('"Disway Certifié"', '"Matériel Certifié"');
content = content.replaceAll('"Disway"', '"ERNET STORE"');
content = content.replaceAll('Disway-style', 'ERNET STORE');
content = content.replaceAll('disway-', 'ernet-');

fs.writeFileSync(TARGET_FILE, content, 'utf-8');
console.log('✅ Toutes les mentions "Disway Maroc Officiel" et "Disway" ont été retirées du catalogue client.');
