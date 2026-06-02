/**
 * Portrait-first play: prompt landscape phone users to rotate upright.
 */
export function initMobileUI() {
  const rotatePrompt = document.getElementById('rotate-prompt');
  const app = document.getElementById('app');

  const isLandscapeMobile = () => {
    const landscape = window.matchMedia('(orientation: landscape)').matches;
    const phoneLike = Math.min(window.innerWidth, window.innerHeight) < 520;
    return landscape && phoneLike;
  };

  const updateOrientation = () => {
    const show = isLandscapeMobile();
    rotatePrompt?.classList.toggle('visible', show);
    if (app) {
      app.classList.toggle('app--hidden', show);
    }
  };

  updateOrientation();
  window.addEventListener('resize', updateOrientation);
  window.matchMedia('(orientation: landscape)').addEventListener('change', updateOrientation);

  return { isLandscapeMobile, updateOrientation };
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
