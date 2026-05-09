import { getSeriesMeta } from './series';
import {
  countryFlag,
  escapeHtml,
  formatDateRange,
  formatLocalTime,
  isPastEvent,
  isPlaceholderTime,
} from './client-utils';
import { SESSION_ABBR, isRaceType } from './sessions';
import type { RaceEvent, RaceSession } from './types';

interface BaseRenderOptions {
  sessions?: RaceSession[];
}

interface WatchlistRenderOptions extends BaseRenderOptions {
  variant: 'watchlist';
  favoriteState: boolean;
}

interface CalendarDetailRenderOptions extends BaseRenderOptions {
  variant: 'calendar-detail';
  dateStr: string;
}

export type RenderClientEventCardOptions = WatchlistRenderOptions | CalendarDetailRenderOptions;

function renderSessionsHtml(sessions: RaceSession[], accentColor: string, nonRaceTextClass: string): string {
  return sessions.map((session) => {
    const isRace = isRaceType(session.type);
    const label = SESSION_ABBR[session.type] ?? session.type;
    const time = formatLocalTime(session.startTimeUTC);

    return `<div class="flex items-center gap-1.5 text-xs">
      <span class="w-1.5 h-1.5 rounded-full shrink-0" style="background-color:${isRace ? accentColor : '#3f3f46'}"></span>
      <span class="font-semibold ${isRace ? 'text-zinc-100' : nonRaceTextClass}">${escapeHtml(label)}</span>
      <span class="tabular-nums text-zinc-600">${escapeHtml(time)}</span>
    </div>`;
  }).join('');
}

function renderCalendarSpanLabel(event: RaceEvent, dateStr: string, accentColor: string): string {
  if (event.dateStart === event.dateEnd) return '';
  if (event.dateStart === dateStr) {
    return '<span class="text-[10px] text-zinc-600">Weekend starts</span>';
  }
  if (event.dateEnd === dateStr) {
    return `<span class="text-[10px] font-bold uppercase tracking-wider" style="color:${accentColor}">Race day</span>`;
  }
  return '<span class="text-[10px] text-zinc-600">Race weekend</span>';
}

export function renderClientEventCard(event: RaceEvent, options: RenderClientEventCardOptions): string {
  const meta = getSeriesMeta(event.seriesId);
  const past = isPastEvent(event.dateEnd, event.sessions ?? []);
  const flag = countryFlag(event.circuit?.countryCode ?? '');
  const validSessions = (options.sessions ?? event.sessions ?? []).filter((session) => !isPlaceholderTime(session.startTimeUTC));
  const sessionsHtml = renderSessionsHtml(
    validSessions,
    meta.color,
    options.variant === 'calendar-detail' ? 'text-zinc-400' : 'text-zinc-500',
  );

  if (options.variant === 'calendar-detail') {
    const spanLabel = renderCalendarSpanLabel(event, options.dateStr, meta.color);

    return `<article
      class="cal-detail-card flex gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${past ? 'border-zinc-800/40 bg-zinc-900/20 opacity-50' : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700'}"
      data-event-id="${escapeHtml(event.id)}"
      role="button" tabindex="0"
    >
      <div class="w-0.5 self-stretch rounded-full shrink-0" style="background-color:${meta.color}"></div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-2 mb-1 flex-wrap">
          <span class="text-xs font-bold px-2 py-0.5 rounded text-white uppercase tracking-wide" style="background-color:${meta.color}">${escapeHtml(meta.shortLabel)}</span>
          <span class="text-[11px] text-zinc-500 font-mono">Rd ${event.round}</span>
          ${spanLabel}
        </div>
        <h3 class="font-bold text-sm ${past ? 'text-zinc-500' : 'text-zinc-100'} mb-1">${escapeHtml(event.eventName)}</h3>
        <div class="flex items-center gap-1.5 text-xs text-zinc-500 ${validSessions.length > 0 ? 'mb-2' : ''}">
          ${flag ? `<span class="text-sm">${flag}</span>` : ''}<span>${escapeHtml(event.circuit?.name ?? '')}</span>
        </div>
        ${validSessions.length > 0 ? `<div class="flex flex-wrap gap-x-3 gap-y-1">${sessionsHtml}</div>` : ''}
      </div>
    </article>`;
  }

  return `<article
    class="group relative rounded-xl border transition-all duration-200 cursor-pointer ${past ? 'border-zinc-800/40 bg-zinc-900/20 opacity-40' : 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700 hover:bg-zinc-900'}"
    data-event-id="${escapeHtml(event.id)}"
    role="button" tabindex="0"
  >
    <div class="absolute left-0 top-3 bottom-3 w-0.5 rounded-full" style="background-color:${meta.color}"></div>
    <div class="px-5 py-4">
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-block rounded font-bold uppercase tracking-wide text-white text-xs px-2 py-0.5" style="background-color:${meta.color}">${escapeHtml(meta.shortLabel)}</span>
          <span class="text-[11px] text-zinc-500 font-mono">Rd ${event.round}</span>
          ${past ? '<span class="text-[10px] px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-600 font-semibold uppercase tracking-widest">Done</span>' : ''}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <span class="text-sm font-medium text-zinc-400 tabular-nums">${escapeHtml(formatDateRange(event.dateStart, event.dateEnd))}</span>
          <button class="fav-btn p-1 rounded-full hover:bg-zinc-800 transition-colors" data-fav="${options.favoriteState ? 'true' : 'false'}" data-fav-id="${escapeHtml(event.id)}" aria-label="${options.favoriteState ? 'Remove from favorites' : 'Add to favorites'}">
            <svg class="w-4 h-4 ${options.favoriteState ? 'fill-rose-500 stroke-rose-500' : 'stroke-zinc-600 fill-none'}" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
            </svg>
          </button>
        </div>
      </div>
      <h3 class="font-bold text-base leading-tight mb-2 ${past ? 'text-zinc-500' : 'text-zinc-100'}">${escapeHtml(event.eventName)}</h3>
      <div class="flex items-center gap-1.5 text-sm text-zinc-500 mb-3">
        ${flag ? `<span class="text-base">${flag}</span>` : ''}
        <span class="text-zinc-400">${escapeHtml(event.circuit?.name ?? '')}</span>
        ${event.circuit?.city ? `<span class="text-zinc-700">·</span><span>${escapeHtml(event.circuit.city)}</span>` : ''}
      </div>
      ${validSessions.length > 0 ? `<div class="flex flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-zinc-800/60">${sessionsHtml}</div>` : ''}
    </div>
  </article>`;
}