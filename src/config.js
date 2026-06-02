import { assetUrl } from './assets.js';

/** @typedef {{ id: string, trigger_item_id: string, title: string, subtitle: string, image: string, url: string }} GiftConfig */

/** CaratLane gift reveals */
export const GIFT_CONFIG = [
  {
    id: 'gift_diamond_1',
    trigger_item_id: 'special_diamond_large',
    title: 'You found it! 💎',
    subtitle: 'Glamore 925 Silver Diamond Necklace',
    image: assetUrl('assets/glamore_necklace.jpg'),
    url: 'https://www.caratlane.com/jewellery/glamore-925-silver-diamond-necklace-bl01014-sss3re.html',
  },
  {
    id: 'gift_diamond_2',
    trigger_item_id: 'special_diamond_medium',
    title: 'You found it! 💍',
    subtitle: 'Nina Diamond Band',
    image: assetUrl('assets/nina_band.jpg'),
    url: 'https://www.caratlane.com/jewellery/nina-diamond-band-jr01683-1ys300.html',
  },
  {
    id: 'gift_diamond_3',
    trigger_item_id: 'special_diamond_cluster',
    title: 'You found it! ✨',
    subtitle: 'Sun Glance Gemstone Ring',
    image: assetUrl('assets/sun_glance_ring.jpg'),
    url: 'https://www.caratlane.com/jewellery/sun-glance-gemstone-ring-jr09935-ygs3ci.html',
  },
];

/** Portrait logical blueprint (9:16) */
export const CANVAS_WIDTH = 540;
export const CANVAS_HEIGHT = 960;
export const CANVAS_DPR = 2;
export const GROUND_HEIGHT = 88;

export const CLAW = {
  cableColor: '#c8d4e8',
  swingSpeed: 1.15,
  swingMin: -Math.PI * 0.48,
  swingMax: Math.PI * 0.48,
  extendSpeed: 480,
  reelSpeed: 320,
  clawRadius: 18,
};

export const MINER = {
  introWalkSpeed: 112,
  groundDrawOffset: 38,
  /** Cable pivot below sprite top-left (with groundDrawOffset) — over boots */
  pivotFootOffsetY: 65,
};

export const WALLS = [
  { x1: 0, y1: GROUND_HEIGHT, x2: 88, y2: GROUND_HEIGHT + 150 },
  { x1: CANVAS_WIDTH, y1: GROUND_HEIGHT, x2: CANVAS_WIDTH - 88, y2: GROUND_HEIGHT + 150 },
  { x1: 0, y1: CANVAS_HEIGHT, x2: 110, y2: CANVAS_HEIGHT - 110 },
  { x1: CANVAS_WIDTH, y1: CANVAS_HEIGHT, x2: CANVAS_WIDTH - 110, y2: CANVAS_HEIGHT - 110 },
  { x1: 36, y1: 400, x2: 110, y2: 490 },
  { x1: 430, y1: 430, x2: 504, y2: 520 },
];

/**
 * @typedef {Object} MineItem
 * @property {string} id
 * @property {'diamond'} kind
 * @property {number} x
 * @property {number} y
 * @property {number} radius
 * @property {number} weight
 */

/** @type {MineItem[]} — diamonds only (no rocks/boulders) */
export const ITEMS = [
  { id: 'd1', kind: 'diamond', x: 90, y: 300, radius: 12, weight: 1 },
  { id: 'd2', kind: 'diamond', x: 270, y: 400, radius: 12, weight: 0.9 },
  { id: 'special_diamond_medium', kind: 'diamond', x: 410, y: 340, radius: 12, weight: 1 },
  { id: 'd4', kind: 'diamond', x: 160, y: 500, radius: 12, weight: 1 },
  { id: 'd5', kind: 'diamond', x: 430, y: 540, radius: 12, weight: 1 },
  { id: 'special_diamond_cluster', kind: 'diamond', x: 300, y: 620, radius: 12, weight: 1.1 },
  { id: 'special_diamond_large', kind: 'diamond', x: 200, y: 740, radius: 12, weight: 1.2 },
  { id: 'd6', kind: 'diamond', x: 390, y: 800, radius: 12, weight: 1 },
  { id: 'd7', kind: 'diamond', x: 110, y: 660, radius: 12, weight: 0.95 },
];

export function getGiftForItem(itemId) {
  return GIFT_CONFIG.find((g) => g.trigger_item_id === itemId) ?? null;
}

export function isGiftItem(itemId) {
  return GIFT_CONFIG.some((g) => g.trigger_item_id === itemId);
}
