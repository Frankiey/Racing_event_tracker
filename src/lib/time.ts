/**
 * Time formatting helpers. All inputs are UTC ISO strings.
 * Actual local-time conversion happens in the browser.
 */

const PLACEHOLDER_YEAR = 1900;

/**
 * Convert an ISO 3166-1 alpha-2 country code to a flag emoji.
 * Returns empty string for alpha-3 or unrecognized codes.
 */
export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  const base = 0x1F1E6 - 0x41;
  return String.fromCodePoint(upper.charCodeAt(0) + base, upper.charCodeAt(1) + base);
}

/**
 * Returns true if the event has already ended (dateEnd is in the past).
 */
export function isPastEvent(dateEnd: string): boolean {
  return new Date(dateEnd + 'T23:59:59Z') < new Date();
}

export function isPlaceholderTime(utc: string): boolean {
  return utc.startsWith(`${PLACEHOLDER_YEAR}-`);
}

/** Format a date range like "Mar 6–8" or "Mar 6" for single-day events. */
export function formatDateRange(dateStart: string, dateEnd: string): string {
  const start = new Date(dateStart + 'T12:00:00Z');
  const end = new Date(dateEnd + 'T12:00:00Z');
  const monthDay = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

  if (dateStart === dateEnd) {
    return monthDay.format(start);
  }

  const startMonth = start.getMonth();
  const endMonth = end.getMonth();

  if (startMonth === endMonth) {
    return `${monthDay.format(start)}–${end.getDate()}`;
  }

  return `${monthDay.format(start)} – ${monthDay.format(end)}`;
}

/** Get the main race session from an event's sessions array. */
export function getRaceSession(sessions: { type: string; startTimeUTC: string }[]): { type: string; startTimeUTC: string } | undefined {
  const raceTypes = ['Race', 'Feature Race', 'Race 2', 'Race 1', 'Sprint Race', 'Superpole Race', 'Sprint'];
  return sessions.find(s => raceTypes.includes(s.type))
    ?? sessions[sessions.length - 1];
}
