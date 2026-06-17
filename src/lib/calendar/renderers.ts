import { escapeHtml } from '../client-utils';
import { renderClientEventCard } from '../event-card-renderer';
import { getSeriesMeta } from '../series';
import type { RaceEvent } from '../types';

export interface CalendarMonthRenderOptions {
  displayYear: number;
  displayMonth: number;
  todayStr: string;
  selectedDates: Set<string>;
  startOffset: number;
  totalDays: number;
  eventsOnDate: (dateStr: string) => RaceEvent[];
}

export interface CalendarMonthRenderResult {
  monthLabel: string;
  cellsHtml: string;
}

export interface CalendarDayDetailRenderOptions {
  dateStrings: string[];
  eventsOnDate: (dateStr: string) => RaceEvent[];
  sessionsOnDate: (event: RaceEvent, dateStr: string) => RaceEvent['sessions'];
  selectionLabel: string;
}

function getCalendarDateLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
}

export function renderCalendarMonthGrid(options: CalendarMonthRenderOptions): CalendarMonthRenderResult {
  const monthLabel = new Date(options.displayYear, options.displayMonth, 1)
    .toLocaleDateString('en', { month: 'long', year: 'numeric' });

  const cells: string[] = [];

  for (let index = 0; index < options.startOffset; index++) {
    cells.push('<div class="bg-zinc-950 min-h-[76px] sm:min-h-[96px]"></div>');
  }

  for (let day = 1; day <= options.totalDays; day++) {
    const dateStr = `${options.displayYear}-${String(options.displayMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isToday = dateStr === options.todayStr;
    const isPast = dateStr < options.todayStr;
    const isSelected = options.selectedDates.has(dateStr);
    const dayEvents = options.eventsOnDate(dateStr);

    const seenSeries = new Set<string>();
    const uniqueEvents = dayEvents.filter((event) => {
      if (seenSeries.has(event.seriesId)) return false;
      seenSeries.add(event.seriesId);
      return true;
    });

    const visibleEvents = uniqueEvents.slice(0, 3);
    const overflow = uniqueEvents.length - visibleEvents.length;
    const badgesHtml = visibleEvents.map((event) => {
      const meta = getSeriesMeta(event.seriesId);
      const isRaceDay = event.dateEnd === dateStr;
      const background = isRaceDay ? meta.color + 'ee' : meta.color + '28';
      const textColor = isRaceDay ? '#ffffff' : meta.color;

      return `<span
        class="shrink-0 text-[9px] font-bold leading-none rounded px-1 py-0.5 whitespace-nowrap block"
        style="background-color:${background};color:${textColor}"
        title="${escapeHtml(event.eventName)}"
      >${escapeHtml(meta.shortLabel)}</span>`;
    }).join('');

    const overflowHtml = overflow > 0
      ? `<span class="text-[9px] text-zinc-600 font-medium leading-none">+${overflow}</span>`
      : '';

    const clashHtml = seenSeries.size >= 3
      ? `<span class="text-[9px] font-bold text-amber-400 leading-none" title="${seenSeries.size} series racing">⚡</span>`
      : '';

    const dayNumClass = isToday
      ? 'w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center bg-emerald-500 text-zinc-950 font-black text-[10px] sm:text-xs leading-none'
      : isPast
        ? 'text-xs sm:text-sm font-medium text-zinc-700 leading-none'
        : 'text-xs sm:text-sm font-medium text-zinc-300 leading-none';

    const cellBase = 'cal-day relative bg-zinc-950 transition-colors cursor-pointer min-h-[76px] sm:min-h-[96px] p-1.5 sm:p-2';
    const cellState = isSelected
      ? 'ring-1 ring-inset ring-zinc-500 bg-zinc-900/80 hover:bg-zinc-900'
      : 'hover:bg-zinc-900/60';

    cells.push(`<div class="${cellBase} ${cellState}" data-date="${dateStr}" role="button" tabindex="0" aria-label="${dateStr}${dayEvents.length > 0 ? `, ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}">
      <div class="flex items-start justify-between mb-1">
        <span class="${dayNumClass}">${day}</span>
      </div>
      <div class="flex flex-wrap gap-0.5 sm:gap-1">
        ${badgesHtml}${overflowHtml}${clashHtml}
      </div>
    </div>`);
  }

  const used = options.startOffset + options.totalDays;
  const trail = (7 - (used % 7)) % 7;
  for (let index = 0; index < trail; index++) {
    cells.push('<div class="bg-zinc-950 min-h-[76px] sm:min-h-[96px]"></div>');
  }

  return { monthLabel, cellsHtml: cells.join('') };
}

export function renderCalendarDayDetail(options: CalendarDayDetailRenderOptions): string {
  if (options.dateStrings.length === 0) return '';

  const daySections = options.dateStrings.map((dateStr) => {
    const dayEvents = options.eventsOnDate(dateStr);
    if (dayEvents.length === 0) return '';

    const cardsHtml = dayEvents.map((event) => renderClientEventCard(event, {
      variant: 'calendar-detail',
      dateStr,
      sessions: options.sessionsOnDate(event, dateStr),
    })).join('');

    return `
      <section class="grid gap-2">
        ${options.dateStrings.length > 1 ? `<div class="px-1 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">${escapeHtml(getCalendarDateLabel(dateStr))}</div>` : ''}
        <div class="grid gap-2 sm:grid-cols-2">${cardsHtml}</div>
      </section>
    `;
  }).filter(Boolean).join('');

  if (!daySections) return '';

  return `
    <div class="mt-3 border border-zinc-800 rounded-xl overflow-hidden">
      <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/40">
        <div class="min-w-0">
          <span class="font-semibold text-sm text-zinc-200">${escapeHtml(options.selectionLabel)}</span>
          <p class="text-[10px] uppercase tracking-widest text-zinc-600 mt-1">Click a day to replace. Cmd/Ctrl-click to add. Shift-click for a range.</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <button id="cal-share-btn" class="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400 transition hover:border-zinc-700 hover:text-zinc-200" type="button">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V4.5m0 12 4.5-4.5M12 16.5l-4.5-4.5M4.5 19.5h15" />
            </svg>
            <span id="cal-share-btn-label">Share PNG</span>
          </button>
          <button id="cal-detail-close" class="text-zinc-600 hover:text-zinc-300 transition-colors p-1" aria-label="Close">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="p-3 grid gap-3">
        ${daySections}
      </div>
    </div>
  `;
}