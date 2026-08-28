// ============================================================
// ERNET STORE — Mapping des marques vers images réelles
// Utilise les photos PNG/JPG/WEBP (non SVG)
// ============================================================

// Clef normalisée -> chemin du fichier image (png/jpg/webp)
const BRAND_IMAGES = {
  intel: 'Intel.png',
  amd: 'AMD.webp',
  nvidia: 'Nvidia.png',
  asus: 'asus.png',
  dell: 'dell.png',
  lenovo: 'Lenovo.png',
  hp: 'HP.png',
  kingston: 'Kingston.jpg',
  seagate: 'seagate.png',
  corsair: 'corsair.jpg',
  coolermaster: 'cooler master.jpg',
  wd: 'western-digital.jpg',
  logitech: 'logitech.jpg',
  msi: 'msi.jpg',
  gigabyte: 'Gigabyte.jpg',
  tplink: 'tp-link.png',
};

/**
 * Retourne le chemin de l'image (png/jpg/webp) pour une marque donnée.
 * @param {string} name Nom de la marque (ex: "Cooler Master", "TP-Link", "WD")
 */
export function brandImage(name) {
  const key = String(name).toLowerCase().replace(/[\s-]/g, '');
  return `assets/brands/${BRAND_IMAGES[key] || `${key}.svg`}`;
}

export default BRAND_IMAGES;
