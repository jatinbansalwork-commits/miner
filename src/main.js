import { MiningGame } from './game.js';
import { AudioManager } from './AudioManager.js';
import { initMobileUI, bindTouchGuards } from './mobile.js';
import { initTohfaQuiz } from './tohfaQuiz.js';
import { closeGiftReveal, triggerGiftReveal } from './giftReveal.js';

const canvas = /** @type {HTMLCanvasElement} */ (document.getElementById('game-canvas'));
const stageWrap = /** @type {HTMLElement} */ (document.getElementById('stage-wrap'));
const hintEl = document.getElementById('hint');

const giftModal = document.getElementById('game-reward-modal');
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
    if (game.quizLocked) return;
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
  onGift: (item) => {
    triggerGiftReveal(item);
    hintEl.style.opacity = '0';
  },
});

game.pause();

initTohfaQuiz({
  game,
  onComplete: (profile) => {
    game.applyQuizProfile(profile);
    game.releaseQuizLock();
    unlockAudio();
  },
});

function closeGiftModal() {
  closeGiftReveal();
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
