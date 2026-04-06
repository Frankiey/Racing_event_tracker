/**
 * Shared series filter state — single source of truth for filter
 * persistence and cross-component synchronisation.
 *
 * Convention:
 *   - Empty set = all series visible (no filter active)
 *   - Non-empty set = only listed series visible
 *
 * Stored in localStorage['rt-filters'] as a JSON array of series IDs.
 * Changes broadcast via the 'rt-filters-changed' CustomEvent.
 */

const STORAGE_KEY = 'rt-filters';

/** Read active filter set from localStorage. Empty set = show all. */
export function loadFilters(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) return new Set(arr);
    }
  } catch { /* corrupt data — treat as "show all" */ }
  return new Set();
}

/** Persist active filter set and broadcast change event. */
export function saveFilters(active: Set<string>): void {
  if (active.size === 0) {
    localStorage.removeItem(STORAGE_KEY);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...active]));
  }
  window.dispatchEvent(
    new CustomEvent('rt-filters-changed', { detail: { active: [...active] } }),
  );
}

/** Apply visibility to elements with `data-series` attribute. */
export function applySeriesVisibility(active: Set<string>): void {
  const showAll = active.size === 0;
  document.querySelectorAll<HTMLElement>('[data-series]').forEach(el => {
    el.style.display = (showAll || active.has(el.dataset.series!)) ? '' : 'none';
  });
}
