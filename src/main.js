import { MiningGame } from './game.js';
import { AudioManager } from './AudioManager.js';
import { initMobileUI, bindTouchGuards } from './mobile.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game-canvas'));
const stageWrap = /** @type {HTMLElement} */ (document.getElementById('stage-wrap'));
const hintEl = document.getElementById('hint');

const giftModal = document.getElementById('gift-modal');
const giftTitle = document.getElementById('gift-title');
const giftSubtitle = document.getElementById('gift-subtitle');
const giftImage = /** @type {HTMLImageElement} */ (document.getElementById('gift-image'));
const giftLink = /** @type {HTMLAnchorElement} */ (document.getElementById('gift-link'));
const giftClose = document.getElementById('gift-close');

const audio = new AudioManager();
void audio.loadFiles();

initMobileUI();
bindTouchGuards(stageWrap, canvas);

function unlockAudio() {
  audio.init();
}

stageWrap.addEventListener('pointerdown', unlockAudio, { passive: true });
window.addEventListener('keydown', unlockAudio, { passive: true });

const game = new MiningGame(canvas, {
  onIntroComplete: () => {
    audio.playReady();
    hintEl.style.opacity = '1';
  },
  onClawStart: () => audio.playLaunch(),
  onClawStop: () => audio.stopLaunch(),
  onItemGrab: (item) => {
    if (item.kind === 'diamond') {
      audio.playGrab();
    }
  },
  onProposalReveal: () => audio.playReveal(),
  onGift: (gift) => {
    giftTitle.textContent = gift.title;
    giftSubtitle.textContent = gift.subtitle;
    giftImage.src = gift.image;
    giftImage.alt = gift.subtitle;
    giftLink.href = gift.url;
    giftLink.textContent = 'View Details';
    giftModal.classList.remove('hidden');
    hintEl.style.opacity = '0';
  },
});

function closeGiftModal() {
  giftModal.classList.add('hidden');
  hintEl.style.opacity = '1';
  audio.resumeBgm();
  game.resume();
}

giftClose.addEventListener('click', closeGiftModal);
giftModal.querySelector('.modal-backdrop')?.addEventListener('click', closeGiftModal);

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(dt);
  game.draw();
  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
