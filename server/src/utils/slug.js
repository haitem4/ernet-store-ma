// Utility to generate URL-friendly slugs from strings
export function slugify(input) {
  if (!input && input !== 0) return '';
  const str = String(input);
  // Normalize accents, convert to lower case
  let s = str.normalize('NFD').replace(/\p{Diacritic}/gu, '');
  s = s.toLowerCase();
  // Replace non-alphanumeric characters with hyphens
  s = s.replace(/[^a-z0-9]+/g, '-');
  // Trim leading/trailing hyphens
  s = s.replace(/^-+|-+$/g, '');
  // Collapse multiple hyphens
  s = s.replace(/-+/g, '-');
  return s || '';
}

export default slugify;
