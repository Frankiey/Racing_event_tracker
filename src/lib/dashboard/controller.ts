import { isPlaceholderTime } from '../time';

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

function mergeVisibleDuplicateWeekSections(): void {
  const visibleSections = [...document.querySelectorAll<HTMLElement>('.week-group')]
    .filter((section) => section.style.display !== 'none');

  let previous: HTMLElement | null = null;
  visibleSections.forEach((section) => {
    const label = section.getAttribute('data-week-section');
    if (!previous || !label) {
      previous = section;
      updateWeekSectionCount(section);
      return;
    }

    const previousLabel = previous.getAttribute('data-week-section');
    if (previousLabel !== label) {
      previous = section;
      updateWeekSectionCount(section);
      return;
    }

    const previousGrid = previous.children[1];
    const sectionGrid = section.children[1];
    if (!(previousGrid instanceof HTMLElement) || !(sectionGrid instanceof HTMLElement)) {
      previous = section;
      updateWeekSectionCount(section);
      return;
    }

    section.querySelectorAll<HTMLElement>('.event-card-wrapper').forEach((card) => {
      previousGrid.appendChild(card);
    });

    const previousEnd = previous.getAttribute('data-week-dateend') ?? '';
    const sectionEnd = section.getAttribute('data-week-dateend') ?? '';
    if (sectionEnd > previousEnd) previous.setAttribute('data-week-dateend', sectionEnd);

    updateWeekSectionCount(previous);
    section.remove();
  });
}

export function refreshDashboardSections(): void {
  const recentGrid = document.getElementById('recent-events');
  const recentSection = document.getElementById('recent-section');
  const mainWrappers = document.querySelectorAll<HTMLElement>('.week-group .event-card-wrapper[data-race-utc]');
  let moved = 0;

  mainWrappers.forEach((wrapper) => {
    const raceUtc = wrapper.getAttribute('data-race-utc') ?? '';
    if (!raceUtc || isPlaceholderTime(raceUtc)) return;
    if (new Date(raceUtc) < new Date()) {
      recentGrid?.appendChild(wrapper);
      moved++;
    }
  });

  document.querySelectorAll<HTMLElement>('.week-group').forEach((section) => {
    if (section.getAttribute('data-lazy-group') === 'true') return;
    if (section.querySelectorAll('.event-card-wrapper').length === 0) {
      section.remove();
    }
  });

  if (moved > 0 && recentSection && recentGrid) {
    recentSection.style.display = '';
    const count = recentGrid.querySelectorAll('[data-series]').length;
    const countSpan = document.querySelector<HTMLElement>('#recent-toggle span:first-of-type');
    if (countSpan) countSpan.textContent = `Recent (${count})`;
  }

  document.querySelectorAll<HTMLElement>('[data-week-date]').forEach((section) => {
    const dateStr = section.getAttribute('data-week-date');
    if (!dateStr) return;
    const dateEndStr = section.getAttribute('data-week-dateend') ?? '';
    const heading = section.querySelector('h2');
    if (!heading) return;

    const eventDate = new Date(dateStr + 'T12:00:00Z');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((eventDate.getTime() - today.getTime()) / 86400000);

    let label: string;
    if (diffDays < 0) {
      if (dateEndStr && new Date(dateEndStr + 'T23:59:59Z').getTime() >= today.getTime()) {
        label = 'Today';
      } else {
        const staleLabel = section.getAttribute('data-week-section');
        if (staleLabel !== 'Today' && staleLabel !== 'Tomorrow') return;
        const daysSinceMonday = (today.getDay() + 6) % 7;
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() - daysSinceMonday + 7);
        const eventLocal = new Date(dateStr + 'T00:00:00');
        label = eventLocal < nextMonday
          ? 'This week'
          : eventDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });
      }
    } else if (diffDays === 0) {
      label = 'Today';
    } else if (diffDays === 1) {
      label = 'Tomorrow';
    } else {
      const daysSinceMonday = (today.getDay() + 6) % 7;
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() - daysSinceMonday + 7);
      const nextNextMonday = new Date(nextMonday);
      nextNextMonday.setDate(nextMonday.getDate() + 7);
      const eventLocal = new Date(dateStr + 'T00:00:00');
      if (eventLocal < nextMonday) label = 'This week';
      else if (eventLocal < nextNextMonday) label = 'Next week';
      else label = eventDate.toLocaleDateString('en', { month: 'long', year: 'numeric' });
    }

    const current = section.getAttribute('data-week-section');
    if (current === label) return;

    section.setAttribute('data-week-section', label);
    const textNode = [...heading.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim().length > 0,
    );
    if (textNode) textNode.textContent = label;
    updateWeekSectionCount(section);
  });

  mergeVisibleDuplicateWeekSections();
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