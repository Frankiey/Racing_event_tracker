import { sessionsOnLocalDate } from '../sessions';
import type { RaceEvent, RaceSession } from '../types';

export type CalendarDateIndex = Map<string, RaceEvent[]>;

export function buildCalendarDateIndex(events: RaceEvent[], activeFilters: Set<string>): CalendarDateIndex {
  const index: CalendarDateIndex = new Map();
  const showAll = activeFilters.size === 0;

  for (const event of events) {
    if (!showAll && !activeFilters.has(event.seriesId)) continue;
    const start = new Date(event.dateStart + 'T12:00:00Z');
    const end = new Date(event.dateEnd + 'T12:00:00Z');

    for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      const key = date.toISOString().slice(0, 10);
      const existing = index.get(key);
      if (existing) existing.push(event);
      else index.set(key, [event]);
    }
  }

  return index;
}

export function getEventsOnDate(index: CalendarDateIndex, dateStr: string): RaceEvent[] {
  return index.get(dateStr) ?? [];
}

export function getSessionsOnCalendarDate(event: RaceEvent, dateStr: string): RaceSession[] {
  return sessionsOnLocalDate(event.sessions ?? [], dateStr);
}