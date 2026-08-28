// ============================================================
// ERNET STORE — Générateur de ZIP de déploiement ultra-léger
// ============================================================
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ignoredNames = new Set([
  'node_modules',
  'pg',
  'pg2',
  'pg3',
  '.pg',
  '.redis',
  '.git',
  '.gemini',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'coverage',
  'uploads',
  '.deploy-staging',
]);

const ignoredFileExts = ['.log', '.zip', '.tmp', '.txt'];
const allowedFiles = new Set(['TODO.md', 'README.md', 'robots.txt', 'sitemap.xml']);

function shouldIgnore(name, isDir) {
  if (ignoredNames.has(name)) return true;
  if (!isDir) {
    if (allowedFiles.has(name)) return false;
    const ext = path.extname(name).toLowerCase();
    if (ignoredFileExts.includes(ext)) return true;
    if (name === '.env') return true;
  }
  return false;
}

function copyClean(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name, entry.isDirectory())) {
      continue;
    }

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      copyClean(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('🚀 [1/3] Construction du frontend de production (Vite build)...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

const stagingDir = path.join(os.tmpdir(), `ernet-store-staging-${Date.now()}`);

console.log('📂 [2/3] Extraction des fichiers sources (sans node_modules ni bases locales)...');
copyClean(rootDir, stagingDir);

const zipDistPath = path.join(rootDir, 'dist.zip');
const zipSourcePath = path.join(rootDir, 'ernet-store-clean.zip');

console.log('📦 [3/3] Compression des archives...');
execSync(
  `powershell -Command "Compress-Archive -Path '${path.join(rootDir, 'client', 'dist', '*')}' -DestinationPath '${zipDistPath}' -Force"`,
  { stdio: 'inherit' }
);

execSync(
  `powershell -Command "Compress-Archive -Path '${stagingDir}\\*' -DestinationPath '${zipSourcePath}' -Force"`,
  { stdio: 'inherit' }
);

fs.rmSync(stagingDir, { recursive: true, force: true });

const distStats = fs.statSync(zipDistPath);
const sourceStats = fs.statSync(zipSourcePath);

console.log('\n============================================================');
console.log('✅ ARCHIVES CRÉÉES AVEC SUCCÈS !');
console.log(`📁 1. Frontend Netlify Drop : dist.zip (${(distStats.size / 1024).toFixed(1)} Ko)`);
console.log(`📁 2. Projet source complet : ernet-store-clean.zip (${(sourceStats.size / 1024 / 1024).toFixed(2)} Mo)`);
console.log('============================================================\n');
