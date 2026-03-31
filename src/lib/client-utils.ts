/**
 * Client-side utility functions shared across pages and components.
 * These are the SINGLE source of truth — import from here instead of
 * re-implementing in each <script> block.
 *
 * Note: time.ts exports server-side helpers (used in .astro frontmatter).
 * This file exports browser-safe equivalents for <script> tags.
 */

/** Convert an ISO 3166-1 alpha-2 country code to a flag emoji. */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  const base = 0x1F1E6 - 0x41;
  return String.fromCodePoint(upper.charCodeAt(0) + base, upper.charCodeAt(1) + base);
}

/** HTML-escape a string to prevent XSS in innerHTML assignments. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Format a UTC ISO string to local time (HH:MM, 24h). */
export function formatLocalTime(utc: string): string {
  return new Date(utc).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/** Format a UTC ISO string to local date + time ("Mon, Mar 6 · 14:00"). */
export function formatLocalDatetime(utc: string): string {
  const d = new Date(utc);
  const date = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const time = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${date} · ${time}`;
}

/** Format a date range like "Mar 6–8" or "Mar 6" for single-day events. */
export function formatDateRange(dateStart: string, dateEnd: string): string {
  const start = new Date(dateStart + 'T12:00:00Z');
  const end = new Date(dateEnd + 'T12:00:00Z');
  const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
  if (dateStart === dateEnd) return fmt.format(start);
  if (start.getMonth() === end.getMonth()) return `${fmt.format(start)}–${end.getDate()}`;
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/** Returns true if the event has already ended. */
export function isPastEvent(dateEnd: string): boolean {
  return new Date(dateEnd + 'T23:59:59Z') < new Date();
}

/** Returns true if the timestamp is a placeholder (year 1900). */
export function isPlaceholderTime(utc: string): boolean {
  return utc.startsWith('1900-');
}

/** Safely parse JSON, returning fallback on failure. */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/** Read favorites from localStorage. */
export function readFavorites(): string[] {
  try {
    const raw = localStorage.getItem('rt-favs');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

/** Estimated session duration in minutes by type. */
export const SESSION_DURATION_MIN: Record<string, number> = {
  'Practice 1': 60, 'Practice 2': 60, 'Practice 3': 60,
  'Free Practice 1': 60, 'Free Practice 2': 60, 'Free Practice 3': 60,
  'Qualifying': 90, 'Sprint Qualifying': 60, 'Sprint Shootout': 60,
  'Sprint': 45, 'Sprint Race': 45,
  'Race': 120, 'Feature Race': 120,
  'Warm Up': 30,
};
const DEFAULT_DURATION = 120;

/** Check if a session is currently live. */
export function isSessionLive(session: { type: string; startTimeUTC: string }): boolean {
  if (isPlaceholderTime(session.startTimeUTC)) return false;
  const now = Date.now();
  const start = new Date(session.startTimeUTC).getTime();
  const dur = (SESSION_DURATION_MIN[session.type] ?? DEFAULT_DURATION) * 60_000;
  return now >= start && now < start + dur;
}

/** Check if any session in an event is currently live. Returns the live session or null. */
export function getLiveSession(sessions: { type: string; startTimeUTC: string }[]): { type: string; startTimeUTC: string } | null {
  return sessions.find(s => isSessionLive(s)) ?? null;
}

/** Sleep verdict for a session start time based on local hour. */
export function sleepVerdict(utc: string): { emoji: string; label: string; cssClass: string } {
  const hour = new Date(utc).getHours() + new Date(utc).getMinutes() / 60;
  if (hour >= 6 && hour < 22) return { emoji: '✅', label: 'Prime time', cssClass: 'text-emerald-400' };
  if (hour >= 22 || hour < 0.5) return { emoji: '⚠️', label: 'Late night', cssClass: 'text-amber-400' };
  if (hour >= 0.5 && hour < 5.5) return { emoji: '😴', label: 'Rough one', cssClass: 'text-rose-400' };
  return { emoji: '🌅', label: 'Early bird', cssClass: 'text-amber-300' };
}

/** Toggle a favorite and persist. Dispatches 'rt-favs-changed'. */
export function toggleFavorite(eventId: string): boolean {
  const favs = new Set(readFavorites());
  const isFav = favs.has(eventId);
  if (isFav) favs.delete(eventId);
  else favs.add(eventId);
  localStorage.setItem('rt-favs', JSON.stringify([...favs]));
  window.dispatchEvent(new CustomEvent('rt-favs-changed'));
  return !isFav;
}
