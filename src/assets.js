const SPRITES = '/assets/sprites';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load ${src}`));
    img.src = src;
  });
}

/** @typedef {{ cave: HTMLImageElement, claw: HTMLImageElement, diamond: HTMLImageElement, miner: HTMLImageElement, ready: boolean }} SpriteSheet */

export async function loadSprites() {
  const [cave, claw, diamond, miner] = await Promise.all([
    loadImage(`${SPRITES}/cave-bg.png`),
    loadImage(`${SPRITES}/claw.png`),
    loadImage(`${SPRITES}/diamond.png`),
    loadImage(`${SPRITES}/miner.png`),
  ]);

  return { cave, claw, diamond, miner, ready: true };
}
