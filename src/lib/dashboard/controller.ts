import { getWeekLabelForDate, isPastEvent } from '../time';
import { getEventAnchorDate } from '../sessions';
import { getRegisteredEvent } from '../event-client';

interface DisclosureConfig {
  toggleId: string;
  panelId: string;
  chevronId: string;
}

function updateWeekSectionCount(section: HTMLElement): void {
  const heading = section.querySelector('h2');
  if (!heading) return;

  const countChip = heading.lastElementChild;
  if (countChip) {
    countChip.textContent = String(section.querySelectorAll('.event-card-wrapper').length);
  }
}

function getSectionGrid(section: HTMLElement): HTMLElement | null {
  const grid = section.children[1];
  return grid instanceof HTMLElement ? grid : null;
}

/** The section carrying `label`, creating an empty one at the right chronological spot if
 * there is none yet (e.g. a "Today" section after the page has been open past midnight).
 * Reusing the first section with the label is also what keeps duplicates from appearing:
 * every card with a given label converges on one section, and the emptied ones are dropped
 * by the cleanup pass below. */
function findOrCreateWeekSection(label: string, anchor: string): HTMLElement | null {
  const sections = [...document.querySelectorAll<HTMLElement>('.week-group')];
  const existing = sections.find((section) => section.getAttribute('data-week-section') === label);
  if (existing) return existing;

  const last = sections.at(-1);
  const container = last?.parentElement;
  if (!last || !container) return null;

  const section = document.createElement('section');
  section.className = 'week-group mb-8';
  section.setAttribute('data-week-section', label);
  section.setAttribute('data-week-date', anchor);
  section.innerHTML =
    '<h2 class="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 flex items-center gap-3">'
    + label
    + '<span class="h-px flex-1 bg-zinc-800/60"></span><span class="text-zinc-700">0</span></h2>'
    + '<div class="grid gap-2.5"></div>';

  // `>=`, not `>`: a section's date is the earliest anchor it held at the last refresh, which
  // can already equal this one (a "Tomorrow" section on the day it becomes today) — the new
  // section still belongs in front of it.
  const before = sections.find((other) => (other.getAttribute('data-week-date') ?? '') >= anchor);
  container.insertBefore(section, before ?? last.nextSibling);
  return section;
}

function insertCardByAnchor(grid: HTMLElement, wrapper: HTMLElement, anchor: string): void {
  const before = [...grid.querySelectorAll<HTMLElement>('.event-card-wrapper')]
    .find((card) => card !== wrapper && (card.dataset.anchorDate ?? '') > anchor);
  grid.insertBefore(wrapper, before ?? null);
}

export function refreshDashboardSections(): void {
  const now = new Date();
  const recentGrid = document.getElementById('recent-events');
  const recentSection = document.getElementById('recent-section');
  let moved = 0;

  document.querySelectorAll<HTMLElement>('.week-group .event-card-wrapper').forEach((wrapper) => {
    const eventId = wrapper.querySelector<HTMLElement>('[data-event-id]')?.dataset.eventId;
    const event = eventId ? getRegisteredEvent(eventId) : undefined;
    if (!event) return;
    // Uses the same end-time-based isPastEvent as EventCard's own badge, so a still-live
    // race (e.g. a Race session in progress) never gets moved into "Recent" out from under it.
    if (isPastEvent(event.dateEnd, event.sessions, now)) {
      recentGrid?.appendChild(wrapper);
      moved++;
      return;
    }

    // Re-bucket against the real clock: sessions finish while the page sits open, which pushes
    // an event's anchor day forward (Friday night → "Tomorrow"), and midnight pulls it back.
    const anchor = getEventAnchorDate(event, now.getTime());
    wrapper.dataset.anchorDate = anchor;
    const label = getWeekLabelForDate(anchor, now);
    const current = wrapper.closest<HTMLElement>('.week-group');
    if (!current || current.getAttribute('data-week-section') === label) return;

    const target = findOrCreateWeekSection(label, anchor);
    const grid = target && getSectionGrid(target);
    if (!target || !grid) return;
    // A card the user can see must not vanish into a section that the lazy loader (or the
    // series filter) has hidden — reveal the destination instead.
    if (target.style.display === 'none' && current.style.display !== 'none') {
      target.style.display = '';
      target.removeAttribute('data-lazy-group');
    }
    insertCardByAnchor(grid, wrapper, anchor);
  });

  document.querySelectorAll<HTMLElement>('.week-group').forEach((section) => {
    const cards = [...section.querySelectorAll<HTMLElement>('.event-card-wrapper')];
    if (cards.length === 0) {
      // Lazy sections stay even when empty: the loader holds a reference and still has to
      // step past them, and a card may yet be re-bucketed into one.
      if (section.getAttribute('data-lazy-group') !== 'true') section.remove();
      return;
    }
    const earliest = cards.map((card) => card.dataset.anchorDate ?? '').filter(Boolean).sort()[0];
    if (earliest) section.setAttribute('data-week-date', earliest);
    updateWeekSectionCount(section);
  });

  if (moved > 0 && recentSection && recentGrid) {
    recentSection.style.display = '';
    const count = recentGrid.querySelectorAll('[data-series]').length;
    const countSpan = document.querySelector<HTMLElement>('#recent-toggle span:first-of-type');
    if (countSpan) countSpan.textContent = `Recent (${count})`;
  }
}

export function initDashboardDisclosures(configs: DisclosureConfig[]): () => void {
  const cleanups = configs.map((config) => {
    const toggle = document.getElementById(config.toggleId);
    const panel = document.getElementById(config.panelId);
    const chevron = document.getElementById(config.chevronId);
    if (!toggle || !panel || !chevron) return () => {};

    const setOpen = (open: boolean) => {
      panel.classList.toggle('hidden', !open);
      chevron.style.transform = open ? 'rotate(90deg)' : '';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    setOpen(!panel.classList.contains('hidden'));
    const handleClick = () => setOpen(panel.classList.contains('hidden'));
    toggle.addEventListener('click', handleClick);
    return () => toggle.removeEventListener('click', handleClick);
  });

  return () => cleanups.forEach((cleanup) => cleanup());
}

export function initDashboardLazyGroups(onRefresh: () => void): () => void {
  const sentinel = document.getElementById('lazy-sentinel');
  const skeleton = document.getElementById('lazy-skeleton');
  const endMsg = document.getElementById('lazy-end');
  const lazyGroups = [...document.querySelectorAll<HTMLElement>('[data-lazy-group="true"]')];
  if (!sentinel) return () => {};

  if (lazyGroups.length === 0) {
    endMsg?.classList.remove('hidden');
    sentinel.remove();
    return () => {};
  }

  let loading = false;
  let timeoutId: number | null = null;

  function revealNextGroup() {
    if (loading) return;
    const group = lazyGroups.shift();
    if (!group) {
      skeleton?.classList.add('hidden');
      endMsg?.classList.remove('hidden');
      sentinel?.remove();
      return;
    }

    loading = true;
    skeleton?.classList.remove('hidden');

    timeoutId = window.setTimeout(() => {
      group.style.display = '';
      group.removeAttribute('data-lazy-group');

      const cards = group.querySelectorAll<HTMLElement>('.event-card-wrapper');
      cards.forEach((card, index) => {
        card.style.animationDelay = `${index * 55}ms`;
        card.classList.add('card-enter');
      });

      onRefresh();
      skeleton?.classList.add('hidden');
      loading = false;
      timeoutId = null;
    }, 280);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting) revealNextGroup();
    },
    { rootMargin: '300px' },
  );

  observer.observe(sentinel);

  return () => {
    observer.disconnect();
    if (timeoutId !== null) window.clearTimeout(timeoutId);
  };
}