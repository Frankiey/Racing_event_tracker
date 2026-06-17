import { countryFlag, escapeHtml, isPastEvent, isPlaceholderTime, sleepVerdict } from '../client-utils';
import {
  formatSessionTime,
  groupSessionsByLocalDay,
  isRaceType,
  isSessionLiveAt,
  isSessionTodayAt,
  SESSION_LABELS,
} from '../sessions';
import type { RaceEvent } from '../types';

export interface ModalSessionViewModel {
  circuitHtml: string;
  sessionsHtml: string;
  isPastEvent: boolean;
}

export function renderModalSessionViewModel(event: RaceEvent, accentColor: string): ModalSessionViewModel {
  const flag = countryFlag(event.circuit.countryCode);
  const validSessions = event.sessions.filter((session) => !isPlaceholderTime(session.startTimeUTC));
  const now = Date.now();
  const nextUpcomingIndex = validSessions.findIndex((session) => {
    const start = new Date(session.startTimeUTC).getTime();
    return start >= now && !isSessionLiveAt(session, now);
  });

  const sessionsHtml = groupSessionsByLocalDay(validSessions).map((group) => {
    const rows = group.sessions.map((session) => {
      const index = validSessions.findIndex(item => item === session);
      const isRace = isRaceType(session.type);
      const isLive = isSessionLiveAt(session, now);
      const isPastSession = new Date(session.startTimeUTC).getTime() < now;
      const isNext = nextUpcomingIndex >= 0 && nextUpcomingIndex === index;
      const dotColor = isLive ? '#10b981' : isRace ? accentColor : isPastSession ? '#27272a' : '#52525b';
      const sleep = !isPastSession && !isLive ? sleepVerdict(session.startTimeUTC) : null;
      const isTodaySession = !isPastSession && !isLive && isSessionTodayAt(session);

      return `
        <div class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${isLive ? 'bg-emerald-950/30 ring-1 ring-emerald-800/50' : isPastSession ? 'opacity-40' : isNext ? 'bg-zinc-800/80 ring-1 ring-zinc-700' : 'hover:bg-zinc-900'}">
          <span class="w-2 h-2 rounded-full shrink-0 ${isLive ? 'live-pulse' : ''}" style="background-color:${dotColor}"></span>
          <span class="flex-1 text-sm font-semibold ${isLive ? 'text-emerald-300' : isRace ? 'text-zinc-100' : isPastSession ? 'text-zinc-600' : 'text-zinc-300'}">${escapeHtml(SESSION_LABELS[session.type] ?? session.type)}</span>
          <time class="text-sm tabular-nums font-mono ${isPastSession ? 'text-zinc-700' : isRace ? 'text-zinc-200' : 'text-zinc-400'}" title="${escapeHtml(session.startTimeUTC)}">
            ${escapeHtml(formatSessionTime(session.startTimeUTC))}
          </time>
          ${isLive ? '<span class="live-pulse inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold uppercase tracking-wide ml-1"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>Live</span>' : ''}
          ${isTodaySession ? '<span class="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-400/10 font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ml-1"><span class="w-1 h-1 rounded-full bg-amber-400 inline-block"></span>Today</span>' : ''}
          ${sleep ? `<span class="text-[10px] ${sleep.cssClass} font-semibold ml-1" title="${escapeHtml(sleep.label)}">${sleep.emoji}</span>` : ''}
          ${isPastSession && !isLive ? '<span class="text-[10px] text-zinc-700 font-semibold uppercase tracking-wide ml-2">Done</span>' : ''}
        </div>
      `;
    }).join('');

    return `
      <section class="relative mt-3 rounded-xl border border-zinc-800/70 bg-zinc-900/35 px-2.5 pb-2.5 pt-4">
        <div class="absolute -top-3 left-3 px-1 bg-zinc-950">
          <span class="inline-flex items-center rounded-full border border-zinc-700/70 bg-zinc-800/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400 shadow-sm shadow-black/40">${escapeHtml(group.dayLabel)}</span>
        </div>
        <div class="space-y-1.5">${rows}</div>
      </section>
    `;
  }).join('');

  return {
    circuitHtml: `
      ${flag ? `<span class="text-lg">${flag}</span>` : ''}
      <span class="font-medium text-zinc-300">${escapeHtml(event.circuit.name)}</span>
      ${event.circuit.city ? `<span class="text-zinc-600">·</span><span>${escapeHtml(event.circuit.city)}</span>` : ''}
      ${event.circuit.country ? `<span class="text-zinc-600">·</span><span>${escapeHtml(event.circuit.country)}</span>` : ''}
    `,
    sessionsHtml,
    isPastEvent: isPastEvent(event.dateEnd, event.sessions),
  };
}