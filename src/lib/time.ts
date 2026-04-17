/**
 * Time & locale helpers — pure functions, safe for both server (Astro
 * frontmatter) and client (script tags).  All date inputs are UTC ISO strings.
 *
 * Consolidates the former time-format.ts into a single module.
 */

import { RACE_TYPES } from './sessions';

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
}

/** Latest real session start time for an event, if one exists. */
export function getEventLastSessionTime(sessions: SessionLike[] = []): Date | null {
  const validTimes = sessions
    .map(session => session.startTimeUTC)
    .filter(utc => !isPlaceholderTime(utc))
    .map(utc => new Date(utc))
    .filter(date => !Number.isNaN(date.getTime()));

  if (validTimes.length === 0) return null;
  return new Date(Math.max(...validTimes.map(date => date.getTime())));
}

/** True if an event has no remaining real sessions. */
export function isPastEvent(dateEnd: string, sessions: SessionLike[] = []): boolean {
  const lastSession = getEventLastSessionTime(sessions);
  if (lastSession) return lastSession < new Date();
  return new Date(dateEnd + 'T23:59:59Z') < new Date();
}

/** True if the timestamp is a placeholder (year 1900). */
export function isPlaceholderTime(utc: string): boolean {
  return !utc || utc.startsWith('1900-');
}

// ── Session helpers ─────────────────────────────────────────────────────────

/** Get the main race session from an event's sessions array. */
export function getRaceSession(sessions: { type: string; startTimeUTC: string }[]): { type: string; startTimeUTC: string } | undefined {
  return sessions.find(s => RACE_TYPES.has(s.type))
    ?? sessions[sessions.length - 1];
}
