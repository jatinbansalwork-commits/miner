import { activateCuration } from './tohfaCatalog.js';

const STORAGE_KEY = 'tohfa_quiz_profile';

/**
 * @typedef {{ aesthetic: 'minimalist' | 'classic' | 'glamour' }} TohfaQuizProfile
 */

/**
 * @param {{
 *   game: import('./game.js').MiningGame,
 *   onComplete: (profile: TohfaQuizProfile) => void,
 * }} options
 */
export function initTohfaQuiz({ game, onComplete }) {
  const screen = document.getElementById('tohfa-quiz-screen');
  if (!screen) return;

  const completeQuiz = (/** @type {TohfaQuizProfile['aesthetic']} */ targetAesthetic) => {
    const profile = { aesthetic: targetAesthetic };

    activateCuration(targetAesthetic);
    game.assignAffiliatePoolToMap();

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    screen.style.display = 'none';
    screen.classList.add('hidden');
    screen.setAttribute('aria-hidden', 'true');

    onComplete(profile);
  };

  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const profile = /** @type {TohfaQuizProfile} */ (JSON.parse(saved));
      completeQuiz(profile.aesthetic);
      return;
    } catch {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }

  screen.setAttribute('aria-hidden', 'false');

  document.querySelectorAll('.m3-choice-btn').forEach((button) => {
    button.addEventListener('click', () => {
      const targetAesthetic = button.getAttribute('data-value');
      if (!targetAesthetic) return;
      completeQuiz(/** @type {TohfaQuizProfile['aesthetic']} */ (targetAesthetic));
    });
  });
}

export function readStoredQuizProfile() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return /** @type {TohfaQuizProfile} */ (JSON.parse(raw));
  } catch {
    return null;
  }
}
