/**
 * Client-side utility functions shared across pages and components.
 * These are the SINGLE source of truth — import from here instead of
 * re-implementing in each <script> block.
 *
 * Note: time.ts re-exports the pure helpers from this file for Astro
 * frontmatter, while browser-only helpers stay here.
 */

import { getSessionDurationMinutes } from './sessions';
import {
  countryFlag,
  formatDateRange,
  formatLocalDatetime,
  formatLocalTime,
  formatLocalValue,
  isPastEvent,
  isPlaceholderTime,
} from './time-format';

export {
  countryFlag,
  formatDateRange,
  formatLocalDatetime,
  formatLocalTime,
  formatLocalValue,
  isPastEvent,
  isPlaceholderTime,
};

/** HTML-escape a string to prevent XSS in innerHTML assignments. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

/** Check if a session is currently live. */
export function isSessionLive(session: { type: string; startTimeUTC: string }): boolean {
  if (isPlaceholderTime(session.startTimeUTC)) return false;
  const now = Date.now();
  const start = new Date(session.startTimeUTC).getTime();
  const dur = getSessionDurationMinutes(session.type) * 60_000;
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
