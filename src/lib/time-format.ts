export type LocalTimeFormat = 'datetime' | 'time' | 'time-short' | 'date' | 'weekday-time';

export function countryFlag(code: string): string {
  if (!code || code.length !== 2) return '';
  const upper = code.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '';
  const base = 0x1F1E6 - 0x41;
  return String.fromCodePoint(upper.charCodeAt(0) + base, upper.charCodeAt(1) + base);
}

export function formatLocalValue(utc: string, format: LocalTimeFormat = 'datetime'): string {
  return new Date(utc).toLocaleString(undefined, getFormatOptions(format));
}

export function formatUtcValue(utc: string, format: LocalTimeFormat = 'datetime'): string {
  return `${new Date(utc).toLocaleString('en', {
    ...getFormatOptions(format),
    timeZone: 'UTC',
  })} UTC`;
}

export function formatLocalTime(utc: string): string {
  return formatLocalValue(utc, 'time-short');
}

export function formatLocalDatetime(utc: string): string {
  return formatLocalValue(utc, 'datetime');
}

export function formatDateRange(dateStart: string, dateEnd: string): string {
  const start = new Date(dateStart + 'T12:00:00Z');
  const end = new Date(dateEnd + 'T12:00:00Z');
  const fmt = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
  if (dateStart === dateEnd) return fmt.format(start);
  if (start.getMonth() === end.getMonth()) return `${fmt.format(start)}–${end.getDate()}`;
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

export function isPastEvent(dateEnd: string): boolean {
  return new Date(dateEnd + 'T23:59:59Z') < new Date();
}

export function isPlaceholderTime(utc: string): boolean {
  return utc.startsWith('1900-');
}

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