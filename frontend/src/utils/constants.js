export const API_BASE_URL = import.meta.env.VITE_API_URL ||
  'http://localhost/AI-Based%20Drone%20Waste%20Detection%20and%20Geospatial%20Mapping%20System%20for%20Smart%20Campus%20Monitoring/backend/api';

export const ML_API_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:8000';

/** Apache origin for uploaded images (Vite dev server cannot serve /uploads paths). */
const API_ORIGIN = (() => {
  const match = API_BASE_URL.match(/^(https?:\/\/[^/]+)/);
  return match ? match[1] : 'http://localhost';
})();

export const resolveImageUrl = (path) => {
  if (!path) return '';
  if (/^(https?|blob):/i.test(path)) return path;
  if (path.startsWith('/')) return `${API_ORIGIN}${path}`;
  const base = API_BASE_URL.replace(/\/backend\/api\/?$/, '').replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
};

export const THEME = {
  primary: '#4ADE80',
  secondary: '#FFFFFF',
  primaryDark: '#22c55e',
  text: '#1f2937',
  muted: '#6b7280',
};

/** Davao del Norte State College (DNSC) — Brgy. New Visayas, Panabo City */
export const CAMPUS_MAP = {
  name: 'Davao del Norte State College (DNSC)',
  address: 'Brgy. New Visayas, Panabo City, Davao del Norte, Philippines',
  lat: 7.3135278,
  lng: 125.6703333,
  zoom: 16,
};

export const ROLES = {
  ADMIN: 'administrator',
  OFFICER: 'environmental_officer',
};

/** UI label — officers are shown as Personnel, not Environmental Officer */
export const formatRoleLabel = (userOrRole) => {
  const slug = typeof userOrRole === 'object'
    ? (userOrRole?.role || userOrRole?.role_slug || '')
    : String(userOrRole || '');
  const name = typeof userOrRole === 'object' ? (userOrRole?.role_name || '') : String(userOrRole || '');
  if (slug === ROLES.OFFICER || name === 'Environmental Officer') return 'Personnel';
  if (slug === ROLES.ADMIN || name === 'Administrator') return 'Administrator';
  return name || slug || 'Personnel';
};

export const WASTE_CATEGORIES = [
  'biodegradable',
  'cardboard',
  'glass',
  'metal',
  'paper',
  'plastic',
];

export const WASTE_CATEGORY_LABELS = {
  biodegradable: 'BIODEGRADABLE',
  cardboard: 'CARDBOARD',
  glass: 'GLASS',
  metal: 'METAL',
  paper: 'PAPER',
  plastic: 'PLASTIC',
};

/** Distinct colors matched to each waste type */
export const CATEGORY_COLORS = {
  biodegradable: '#2e7d32', // forest green — organic / compost
  cardboard: '#8d5a2b',     // kraft brown — cardboard
  glass: '#29b6f6',         // sky blue — glass tint
  metal: '#607d8b',         // steel gray — metal
  paper: '#f9a825',         // golden yellow — paper
  plastic: '#1565c0',       // deep blue — plastic
};

/** Old DB categories → colors (until data is migrated) */
export const LEGACY_CATEGORY_COLORS = {
  organic: '#2e7d32',
  electronic: '#5e35b1',
  hazardous: '#c62828',
  mixed: '#8d5a2b',
  other: '#78909c',
};

/** Map legacy category slugs to current labels */
export const LEGACY_CATEGORY_ALIASES = {
  organic: 'biodegradable',
  electronic: 'plastic',
  hazardous: 'biodegradable',
  mixed: 'cardboard',
  other: 'biodegradable',
};

/** Green shades for hotspot / zone bar charts */
export const HOTSPOT_BAR_COLORS = [
  '#15803d',
  '#16a34a',
  '#22c55e',
  '#4ade80',
  '#86efac',
  '#14532d',
  '#166534',
  '#65a30d',
];

/** Text color for badges on category backgrounds */
export const CATEGORY_TEXT_COLORS = {
  biodegradable: '#ffffff',
  cardboard: '#ffffff',
  glass: '#0c4a6e',
  metal: '#ffffff',
  paper: '#422006',
  plastic: '#ffffff',
};

export const resolveCategoryKey = (category) => {
  if (!category) return '';
  const raw = String(category).toLowerCase();
  if (CATEGORY_COLORS[raw]) return raw;
  if (LEGACY_CATEGORY_ALIASES[raw]) return LEGACY_CATEGORY_ALIASES[raw];
  const fromLabel = Object.entries(WASTE_CATEGORY_LABELS).find(
    ([, label]) => label === String(category).toUpperCase(),
  );
  return fromLabel?.[0] || raw;
};

export const getCategoryColor = (category) => {
  if (!category) return '#94a3b8';
  const raw = String(category).toLowerCase();
  const key = resolveCategoryKey(category);
  return CATEGORY_COLORS[key]
    || LEGACY_CATEGORY_COLORS[raw]
    || LEGACY_CATEGORY_COLORS[key]
    || '#94a3b8';
};

export const getCategoryTextColor = (category) =>
  CATEGORY_TEXT_COLORS[resolveCategoryKey(category)] || '#ffffff';

export const getCategoryColorLight = (category, alpha = 0.22) => {
  const hex = getCategoryColor(category).replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const formatWasteCategory = (category) => {
  if (!category) return '';
  const raw = String(category).toLowerCase();
  if (WASTE_CATEGORY_LABELS[raw]) return WASTE_CATEGORY_LABELS[raw];
  if (LEGACY_CATEGORY_COLORS[raw]) return raw.toUpperCase();
  const key = resolveCategoryKey(category);
  return WASTE_CATEGORY_LABELS[key] || String(category).toUpperCase();
};
