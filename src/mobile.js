/**
 * Portrait prompt + responsive stage sizing for mobile landscape play.
 */
export function initMobileUI() {
  const rotatePrompt = document.getElementById('rotate-prompt');
  const app = document.getElementById('app');

  const isPortraitMobile = () => {
    const portrait = window.matchMedia('(orientation: portrait)').matches;
    const narrow = window.innerWidth < 900;
    const short = window.innerHeight > window.innerWidth;
    return portrait && narrow && short;
  };

  const updateOrientation = () => {
    const show = isPortraitMobile();
    rotatePrompt?.classList.toggle('visible', show);
    if (app) {
      app.classList.toggle('app--hidden', show);
    }
  };

  updateOrientation();
  window.addEventListener('resize', updateOrientation);
  window.matchMedia('(orientation: portrait)').addEventListener('change', updateOrientation);

  return { isPortraitMobile, updateOrientation };
}

/**
 * Prevent scroll/zoom gestures on the play surface.
 * @param {HTMLElement} stageWrap
 * @param {HTMLCanvasElement} canvas
 */
export function bindTouchGuards(stageWrap, canvas) {
  const block = (e) => {
    if (e.cancelable) e.preventDefault();
  };

  stageWrap.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length > 1) block(e);
    },
    { passive: false },
  );

  canvas.addEventListener('gesturestart', block, { passive: false });
  canvas.addEventListener('gesturechange', block, { passive: false });
  canvas.addEventListener('gestureend', block, { passive: false });

  let lastTouchEnd = 0;
  stageWrap.addEventListener(
    'touchend',
    (e) => {
      const now = Date.now();
      if (now - lastTouchEnd < 320) block(e);
      lastTouchEnd = now;
    },
    { passive: false },
  );
}
