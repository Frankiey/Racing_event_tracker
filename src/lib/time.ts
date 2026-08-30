/**
 * Time & locale helpers — pure functions, safe for both server (Astro
 * frontmatter) and client (script tags).  All date inputs are UTC ISO strings.
 *
 * Consolidates the former time-format.ts into a single module.
 */

import { RACE_TYPES, getSessionEstimatedEndTime } from './sessions';

// ── Types ───────────────────────────────────────────────────────────────────

export type LocalTimeFormat = 'datetime' | 'time' | 'time-short' | 'date' | 'weekday-time';

// ── Country flag ────────────────────────────────────────────────────────────

/** Emoji flag from ISO 3166-1 alpha-2 code. Returns '' for invalid input. */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  const base = 0x1F1E6 - 0x41;
  return String.fromCodePoint(upper.charCodeAt(0) + base, upper.charCodeAt(1) + base);
}

// ── Formatting ──────────────────────────────────────────────────────────────

function getFormatOptions(format: LocalTimeFormat): Intl.DateTimeFormatOptions {
  switch (format) {
    case 'date':
      return { month: 'short', day: 'numeric' };
    case 'time':
    case 'time-short':
      return { hour: '2-digit', minute: '2-digit', hour12: false };
    case 'weekday-time':
      return { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false };
    case 'datetime':
    default:
      return { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
  }
}

/** Format a UTC string in the user's local timezone. */
export function formatLocalValue(utc: string, format: LocalTimeFormat = 'datetime'): string {
  return new Date(utc).toLocaleString(undefined, getFormatOptions(format));
}

/** Format a UTC string showing the UTC value (with "UTC" suffix). */
export function formatUtcValue(utc: string, format: LocalTimeFormat = 'datetime'): string {
  return `${new Date(utc).toLocaleString('en', {
    ...getFormatOptions(format),
    timeZone: 'UTC',
  })} UTC`;
}

/** Shorthand: local time-short format (HH:MM). */
export function formatLocalTime(utc: string): string {
  return formatLocalValue(utc, 'time-short');
}

/** Shorthand: local datetime format. */
export function formatLocalDatetime(utc: string): string {
  return formatLocalValue(utc, 'datetime');
}

/** Human-readable date range (e.g. "Jun 7–9" or "Jun 28 – Jul 1"). */
export function formatDateRange(dateStart: string, dateEnd: string): string {
  const start = new Date(dateStart + 'T12:00:00Z');
  const end = new Date(dateEnd + 'T12:00:00Z');
  const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
  if (dateStart === dateEnd) return fmt.format(start);
  if (start.getMonth() === end.getMonth()) return `${fmt.format(start)}–${end.getDate()}`;
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

// ── Date predicates ─────────────────────────────────────────────────────────

export interface SessionLike {
  type: string;
  startTimeUTC: string;
  endTimeUTC?: string;
}

/** Estimated end time of an event's chronologically-last real session, if one exists.
 * Uses the session's end time (explicit or estimated from duration), not its start —
 * otherwise a still-live final session (e.g. the Race) would count as "past" the
 * instant it starts, contradicting isSessionLiveAt for the same session. */
export function getEventLastSessionTime(sessions: SessionLike[] = []): Date | null {
  const validSessions = sessions.filter(s => !isPlaceholderTime(s.startTimeUTC));
  if (validSessions.length === 0) return null;

  const last = validSessions.reduce((latest, s) =>
    new Date(s.startTimeUTC).getTime() > new Date(latest.startTimeUTC).getTime() ? s : latest);
  return new Date(getSessionEstimatedEndTime(last));
}

/** True if an event has no remaining real sessions (including the last one still running). */
export function isPastEvent(dateEnd: string, sessions: SessionLike[] = [], now: Date = new Date()): boolean {
  const lastSessionEnd = getEventLastSessionTime(sessions);
  if (lastSessionEnd) return lastSessionEnd < now;
  return new Date(dateEnd + 'T23:59:59Z') < now;
}

/** True if the timestamp is a placeholder (year 1900). */
export function isPlaceholderTime(utc: string): boolean {
  return !utc || utc.startsWith('1900-');
}

// ── Session helpers ─────────────────────────────────────────────────────────

/** Get the main race session from an event's sessions array.
 * Returns the LAST race-type session so that on sprint weekends the main Race
 * (Sunday) is preferred over the Sprint (Saturday). Falls back to the last
 * session overall if no race-type session exists. */
export function getRaceSession(sessions: { type: string; startTimeUTC: string }[]): { type: string; startTimeUTC: string } | undefined {
  const raceSessions = sessions.filter(s => RACE_TYPES.has(s.type));
  return raceSessions[raceSessions.length - 1] ?? sessions[sessions.length - 1];
}

/** Among a set of events, find the one whose race session starts soonest after `now`.
 * Single source of truth for "next up" — used both at build time (index/series pages)
 * and recomputed client-side (EventCard) so the answer can't go stale between builds. */
export function getNextRaceMatch<T extends { sessions: { type: string; startTimeUTC: string }[] }>(
  events: T[],
  now: Date = new Date(),
): { event: T; session: { type: string; startTimeUTC: string } } | undefined {
  return events
    .map(event => ({ event, session: getRaceSession(event.sessions) }))
    .filter((x): x is { event: T; session: { type: string; startTimeUTC: string } } =>
      !!x.session && !isPlaceholderTime(x.session.startTimeUTC) && new Date(x.session.startTimeUTC) > now)
    .sort((a, b) => new Date(a.session.startTimeUTC).getTime() - new Date(b.session.startTimeUTC).getTime())[0];
}
