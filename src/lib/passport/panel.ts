import { countryFlag, escapeHtml, formatDateRange } from '../client-utils';
import { emitOpenEvent } from '../ui/rt-events';
import type {
  PassportEvent,
  PassportFullEvent,
  PassportSeriesMetaMap,
} from './types';

export function renderEmptyPassportPanel(panel: HTMLElement): void {
  panel.innerHTML = '<p class="text-sm text-zinc-600 text-center">Click a dot on the globe to see event details</p>';
}

export function renderPassportEventPanel(
  panel: HTMLElement,
  event: PassportEvent,
  meta: PassportSeriesMetaMap,
  fullEvents: PassportFullEvent[],
): void {
  const color = meta[event.seriesId]?.color ?? '#71717a';
  const shortLabel = meta[event.seriesId]?.shortLabel ?? event.seriesId;
  const dateRange = formatDateRange(event.dateStart, event.dateEnd);
  const status = event.isPast ? 'Completed' : 'Upcoming';
  const statusClass = event.isPast ? 'bg-zinc-800 text-zinc-500' : '';
  const flag = countryFlag(event.countryCode ?? '');

  panel.innerHTML = `
    <div class="w-full">
      <div class="flex items-center gap-2 mb-3">
        <span class="inline-block rounded font-bold uppercase tracking-wide text-white text-xs px-2 py-0.5" style="background:${color}">${escapeHtml(shortLabel)}</span>
        <span class="text-xs text-zinc-500 font-mono">Round ${event.round}</span>
        <span class="text-xs px-2 py-0.5 rounded-full font-semibold ${statusClass}" ${!event.isPast ? `style="background:${color}20;color:${color}"` : ''}>${status}</span>
      </div>
      <h3 class="text-xl font-black text-zinc-100 tracking-tight leading-tight mb-2">${escapeHtml(event.name)}</h3>
      <div class="space-y-3 mt-4">
        <div class="flex items-start gap-3">
          <svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0 1 15 0Z"/>
          </svg>
          <div>
            <p class="text-sm font-medium text-zinc-200">${escapeHtml(event.circuit)}</p>
            <p class="text-xs text-zinc-500">${escapeHtml([event.city, event.country].filter(Boolean).join(', '))}</p>
          </div>
        </div>
        <div class="flex items-start gap-3">
          ${flag ? `<span class="text-lg leading-none mt-0.5">${flag}</span>` : `<svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5"/></svg>`}
          <div><p class="text-sm text-zinc-300">${escapeHtml(event.country)}</p></div>
        </div>
        <div class="flex items-start gap-3">
          <svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
          </svg>
          <div><p class="text-sm text-zinc-300">${escapeHtml(dateRange)}</p></div>
        </div>
        <div class="flex items-start gap-3">
          <svg class="w-4 h-4 text-zinc-600 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"/>
          </svg>
          <div><p class="text-xs text-zinc-500 font-mono">${event.lat.toFixed(3)}, ${event.lng.toFixed(3)}</p></div>
        </div>
      </div>
      <div class="mt-5 pt-4 border-t border-zinc-800/60">
        <button class="globe-open-modal text-xs font-medium px-3 py-2 rounded-lg border border-zinc-700/60 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-colors w-full" data-event-id="${escapeHtml(event.id)}">
          View full event details →
        </button>
      </div>
    </div>
  `;

  const button = panel.querySelector<HTMLButtonElement>('.globe-open-modal');
  if (button) {
    button.addEventListener('click', () => {
      const fullEvent = fullEvents.find((full) => full.id === event.id);
      if (fullEvent) emitOpenEvent(fullEvent as never);
    });
  }
}