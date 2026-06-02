/** Exact public/ filenames (case-sensitive on Linux / Vercel) */
const SPRITE_PATHS = {
  cave: 'assets/sprites/cave-bg.png',
  claw: 'assets/sprites/claw.png',
  diamond: 'assets/sprites/diamond.png',
  miner: 'assets/sprites/miner.png',
};

/**
 * Resolve a path under Vite `public/` for any deploy base URL.
 * @param {string} relativePath e.g. `assets/sprites/miner.png` or `./assets/miner.png`
 */
export function assetUrl(relativePath) {
  const base = import.meta.env.BASE_URL ?? '/';
  const safeBase = base.endsWith('/') ? base : `${base}/`;
  const safePath = relativePath.replace(/^\.\//, '').replace(/^\//, '');
  return `${safeBase}${safePath}`;
}

/**
 * @param {string} src
 * @param {string} label
 */
function loadImage(src, label) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      console.error(
        `Failed to load ${label} asset! Check case-sensitivity and directory location.`,
        src,
      );
      reject(new Error(`Failed to load ${src}`));
    };
    img.src = src;
  });
}

/**
 * @param {keyof typeof SPRITE_PATHS} key
 */
async function loadSprite(key) {
  const relativePath = SPRITE_PATHS[key];
  const src = assetUrl(relativePath);
  try {
    return await loadImage(src, key);
  } catch {
    return null;
  }
}

/** @typedef {{ cave: HTMLImageElement | null, claw: HTMLImageElement | null, diamond: HTMLImageElement | null, miner: HTMLImageElement | null, ready: boolean }} SpriteSheet */

export async function loadSprites() {
  const [cave, claw, diamond, miner] = await Promise.all([
    loadSprite('cave'),
    loadSprite('claw'),
    loadSprite('diamond'),
    loadSprite('miner'),
  ]);

  const ready = Boolean(
    cave?.complete && claw?.complete && diamond?.complete && miner?.complete,
  );

  if (!ready) {
    console.warn('Sprite load incomplete — missing:', {
      cave: !cave,
      claw: !claw,
      diamond: !diamond,
      miner: !miner,
    });
  }

  return { cave, claw, diamond, miner, ready };
}
