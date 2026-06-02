import { assetUrl } from './assets.js';

/** @typedef {'minimalist' | 'classic' | 'glamour'} TohfaAesthetic */
/** @typedef {{ title: string, name: string, image: string, url: string }} TohfaCatalogEntry */
/** @typedef {{ trigger_item_id: string, title: string, subtitle: string, image: string, url: string }} CuratedGift */

/** Surprise gems in the cave — bound to active pool in order */
export const CURATED_TRIGGER_IDS = [
  'special_diamond_medium',
  'special_diamond_large',
  'special_diamond_cluster',
];

/** Modular curation database matrix */
export const TOHFA_CATALOG = {
  minimalist: [
    {
      title: 'Perfect Match! 🌿',
      name: 'Sun Glance Minimalist Ring',
      image: assetUrl('assets/sun_glance_ring.jpg'),
      url: 'https://www.caratlane.com/jewellery/sun-glance-gemstone-ring-jr09935-ygs3ci.html',
    },
    {
      title: 'Found a Gem! ✨',
      name: 'Dainty Daily Wear Chain',
      image: assetUrl('assets/glamore_necklace.jpg'),
      url: 'YOUR_AMAZON_AFFILIATE_LINK_HERE',
    },
  ],
  classic: [
    {
      title: 'Timeless Choice! 💍',
      name: 'Nina Diamond Band',
      image: assetUrl('assets/nina_band.jpg'),
      url: 'https://www.caratlane.com/jewellery/nina-diamond-band-jr01683-1ys300.html',
    },
  ],
  glamour: [
    {
      title: 'Showstopper! 💎',
      name: 'Premium Cluster Diamond Ring',
      image: assetUrl('assets/nina_band.jpg'),
      url: 'YOUR_HIGH_TIER_AFFILIATE_LINK',
    },
  ],
};

/** @type {TohfaCatalogEntry[]} */
export let activePool = [];

/** @type {CuratedGift[]} */
let curatedBindings = [];

function normalizeUrl(url) {
  const markdown = url.match(/\[[^\]]*]\(([^)]+)\)/);
  return markdown ? markdown[1] : url;
}

/**
 * @param {TohfaCatalogEntry} entry
 * @returns {TohfaCatalogEntry}
 */
function normalizeEntry(entry) {
  return {
    ...entry,
    image: entry.image.startsWith('http')
      ? entry.image
      : assetUrl(entry.image.replace(/^\.\//, '')),
    url: normalizeUrl(entry.url),
  };
}

/**
 * @param {string} targetAesthetic
 */
export function setActivePoolFromAesthetic(targetAesthetic) {
  const key =
    targetAesthetic && targetAesthetic in TOHFA_CATALOG ? targetAesthetic : 'minimalist';
  activePool = TOHFA_CATALOG[/** @type {TohfaAesthetic} */ (key)].map(normalizeEntry);
  return activePool;
}

/**
 * @param {TohfaAesthetic | string | undefined} aesthetic
 */
export function activateCuration(aesthetic) {
  setActivePoolFromAesthetic(aesthetic);

  curatedBindings = CURATED_TRIGGER_IDS.map((trigger_item_id, index) => {
    const entry = activePool[index % activePool.length];
    return {
      trigger_item_id,
      title: entry.title,
      subtitle: entry.name,
      image: entry.image,
      url: entry.url,
    };
  });
}

export function getActivePool() {
  return activePool;
}

export function getCuratedBindings() {
  return curatedBindings;
}

/**
 * @param {string} itemId
 * @returns {CuratedGift | null}
 */
export function getGiftForItem(itemId) {
  return curatedBindings.find((g) => g.trigger_item_id === itemId) ?? null;
}

/**
 * @param {string} itemId
 */
export function isGiftItem(itemId) {
  return CURATED_TRIGGER_IDS.includes(itemId);
}

/**
 * @param {TohfaCatalogEntry} entry
 * @returns {CuratedGift}
 */
export function catalogEntryToGift(entry) {
  return {
    trigger_item_id: '',
    title: entry.title,
    subtitle: entry.name,
    image: entry.image,
    url: entry.url,
  };
}
