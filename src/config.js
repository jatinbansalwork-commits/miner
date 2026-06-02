/** @typedef {{ id: string, trigger_item_id: string, title: string, subtitle: string, image: string, url: string }} GiftConfig */

/** CaratLane gift reveals */
export const GIFT_CONFIG = [
  {
    id: 'gift_diamond_1',
    trigger_item_id: 'special_diamond_large',
    title: 'You found it! 💎',
    subtitle: 'Glamore 925 Silver Diamond Necklace',
    image: '/assets/glamore_necklace.jpg',
    url: 'https://www.caratlane.com/jewellery/glamore-925-silver-diamond-necklace-bl01014-sss3re.html',
  },
  {
    id: 'gift_diamond_2',
    trigger_item_id: 'special_diamond_medium',
    title: 'You found it! 💍',
    subtitle: 'Nina Diamond Band',
    image: '/assets/nina_band.jpg',
    url: 'https://www.caratlane.com/jewellery/nina-diamond-band-jr01683-1ys300.html',
  },
  {
    id: 'gift_diamond_3',
    trigger_item_id: 'special_diamond_cluster',
    title: 'You found it! ✨',
    subtitle: 'Sun Glance Gemstone Ring',
    image: '/assets/sun_glance_ring.jpg',
    url: 'https://www.caratlane.com/jewellery/sun-glance-gemstone-ring-jr09935-ygs3ci.html',
  },
];

export const CANVAS_WIDTH = 1280;
export const CANVAS_HEIGHT = 720;
export const GROUND_HEIGHT = 72;

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
  { x1: 0, y1: GROUND_HEIGHT, x2: 180, y2: GROUND_HEIGHT + 120 },
  { x1: CANVAS_WIDTH, y1: GROUND_HEIGHT, x2: CANVAS_WIDTH - 180, y2: GROUND_HEIGHT + 120 },
  { x1: 0, y1: CANVAS_HEIGHT, x2: 220, y2: CANVAS_HEIGHT - 80 },
  { x1: CANVAS_WIDTH, y1: CANVAS_HEIGHT, x2: CANVAS_WIDTH - 220, y2: CANVAS_HEIGHT - 80 },
  { x1: 320, y1: 280, x2: 420, y2: 380 },
  { x1: 860, y1: 320, x2: 960, y2: 420 },
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
  { id: 'd1', kind: 'diamond', x: 180, y: 420, radius: 12, weight: 1 },
  { id: 'd2', kind: 'diamond', x: 320, y: 520, radius: 12, weight: 0.9 },
  { id: 'special_diamond_medium', kind: 'diamond', x: 440, y: 460, radius: 12, weight: 1 },
  { id: 'd4', kind: 'diamond', x: 1050, y: 420, radius: 12, weight: 1 },
  { id: 'd5', kind: 'diamond', x: 280, y: 360, radius: 12, weight: 1 },
  { id: 'special_diamond_cluster', kind: 'diamond', x: 680, y: 480, radius: 12, weight: 1.1 },
  { id: 'special_diamond_large', kind: 'diamond', x: 520, y: 580, radius: 12, weight: 1.2 },
  { id: 'd6', kind: 'diamond', x: 860, y: 540, radius: 12, weight: 1 },
  { id: 'd7', kind: 'diamond', x: 960, y: 620, radius: 12, weight: 0.95 },
];

export function getGiftForItem(itemId) {
  return GIFT_CONFIG.find((g) => g.trigger_item_id === itemId) ?? null;
}

export function isGiftItem(itemId) {
  return GIFT_CONFIG.some((g) => g.trigger_item_id === itemId);
}
