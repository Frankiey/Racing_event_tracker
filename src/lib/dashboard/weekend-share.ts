import { downloadWeekendShareCard, getWeekendShareCardData } from '../share-card';
import type { RaceEvent } from '../types';

export function renderWeekendShare(events: RaceEvent[]): void {
  const summary = document.getElementById('weekend-share-summary');
  const button = document.getElementById('weekend-share-btn') as HTMLButtonElement | null;
  const buttonLabel = document.getElementById('weekend-share-btn-label');
  const slot = document.getElementById('weekend-share-slot');
  if (!summary || !button || !buttonLabel || !slot) return;

  const data = getWeekendShareCardData(events);
  if (!data) {
    slot.classList.add('hidden');
    return;
  }

  slot.classList.remove('hidden');
  summary.textContent = `${data.rangeLabel} • ${data.eventCount} events • ${data.sessionCount} sessions`;

  button.disabled = false;
  if (button.dataset.loading !== 'true') {
    buttonLabel.textContent = 'Weekend Card';
  }
}

export function initWeekendShare(events: RaceEvent[]): () => void {
  const button = document.getElementById('weekend-share-btn') as HTMLButtonElement | null;
  const buttonLabel = document.getElementById('weekend-share-btn-label');
  if (!button || !buttonLabel) return () => {};

  renderWeekendShare(events);

  const handleClick = () => {
    if (button.disabled || button.dataset.loading === 'true') return;

    button.dataset.loading = 'true';
    button.disabled = true;
    buttonLabel.textContent = 'Preparing';

    try {
      const downloaded = downloadWeekendShareCard(events);
      buttonLabel.textContent = downloaded ? 'Saved' : 'Unavailable';
    } catch {
      buttonLabel.textContent = 'Try again';
    } finally {
      window.setTimeout(() => {
        delete button.dataset.loading;
        renderWeekendShare(events);
      }, 900);
    }
  };

  if (button.dataset.bound !== 'true') {
    button.dataset.bound = 'true';
    button.addEventListener('click', handleClick);
  }

  return () => {
    button.removeEventListener('click', handleClick);
    delete button.dataset.bound;
  };
}