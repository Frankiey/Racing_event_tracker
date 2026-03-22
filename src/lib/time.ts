/**
 * Time formatting helpers. All inputs are UTC ISO strings.
 * Actual local-time conversion happens in the browser.
 */

const PLACEHOLDER_YEAR = 1900;

export function isPlaceholderTime(utc: string): boolean {
  return utc.startsWith(`${PLACEHOLDER_YEAR}-`);
}

/** Format a date range like "Mar 6–8" or "Mar 6" for single-day events. */
export function formatDateRange(dateStart: string, dateEnd: string): string {
  const start = new Date(dateStart + 'T00:00:00');
  const end = new Date(dateEnd + 'T00:00:00');
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
  return sessions.find(s => s.type === 'Race' || s.type === 'Feature Race')
    ?? sessions[sessions.length - 1];
}
