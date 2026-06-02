/**
 * @param {{ affiliateData?: { title: string, name: string, image: string, url: string } | null }} item
 */
export function triggerGiftReveal(item) {
  if (!item.affiliateData) return;

  const data = item.affiliateData;

  const titleEl = document.getElementById('modal-title-node');
  const subtitleEl = document.getElementById('modal-subtitle-node');
  const imgEl = /** @type {HTMLImageElement | null} */ (document.getElementById('modal-img-node'));
  const actionBtn = /** @type {HTMLButtonElement | null} */ (
    document.getElementById('modal-primary-btn')
  );
  const modal = document.getElementById('game-reward-modal');

  if (!titleEl || !subtitleEl || !imgEl || !actionBtn || !modal) return;

  titleEl.innerText = data.title;
  subtitleEl.innerText = data.name;
  imgEl.src = data.image;
  imgEl.alt = data.name;

  actionBtn.onclick = () => {
    if (data.url && !data.url.startsWith('YOUR_')) {
      window.open(data.url, '_blank', 'noopener,noreferrer');
    }
  };

  modal.classList.remove('hidden');
  modal.style.display = 'flex';
}

export function closeGiftReveal() {
  const modal = document.getElementById('game-reward-modal');
  if (!modal) return;
  modal.style.display = 'none';
  modal.classList.add('hidden');
}
