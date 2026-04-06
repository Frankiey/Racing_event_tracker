/**
 * ICS calendar file generation — pure client-side.
 * Generates RFC 5545 compliant .ics files from event data.
 */

import broadcasts from '../../data/gold/broadcasts.json';
import { SERIES_META } from './series-client';
import type { RaceEvent, RaceSession } from './types';

type IcsSession = RaceSession;
type IcsEvent = Pick<RaceEvent, 'id' | 'seriesId' | 'eventName' | 'circuit' | 'sessions'>;

type BroadcastEntry = {
  channel: string;
  type: string;
  note?: string;
};

type BroadcastRegionMap = Record<string, BroadcastEntry[]>;

const BROADCASTS = broadcasts as {
  regions?: Record<string, { label: string; flag?: string }>;
  series?: Record<string, BroadcastRegionMap>;
};

const SERIES_EMOJI: Record<string, string> = {
  f1: '🔴',
  f2: '🔺',
  f3: '🔻',
  fe: '🔵',
  indycar: '🟡',
  nascar: '🟦',
  motogp: '🟠',
  moto2: '🟧',
  moto3: '🟨',
  wec: '🟢',
  wsbk: '⚫',
  imsa: '🟩',
  dtm: '🟣',
  nls: '🟤',
  superformula: '⚪',
  iomtt: '🏍️',
};

const SESSION_DURATION_MIN: Record<string, number> = {
  'Practice 1': 60, 'Practice 2': 60, 'Practice 3': 60,
  'Free Practice 1': 60, 'Free Practice 2': 60, 'Free Practice 3': 60,
  'Qualifying': 90, 'Sprint Qualifying': 60, 'Sprint Shootout': 60,
  'Sprint': 45, 'Sprint Race': 45,
  'Race': 120, 'Feature Race': 120,
  'Warm Up': 30,
};

function toIcsDate(utc: string): string {
  return utc.replace(/[-:]/g, '').replace(/\.\d+/, '').replace('T', 'T').slice(0, 15) + 'Z';
}

function addMinutes(utc: string, minutes: number): string {
  const d = new Date(utc);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString();
}

function escapeIcs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function getSeriesSummaryPrefix(seriesId: string): string {
  const meta = SERIES_META[seriesId] ?? {
    shortLabel: seriesId.toUpperCase(),
  };

  return `${SERIES_EMOJI[seriesId] ?? '🏁'} ${meta.shortLabel}`;
}

function formatBroadcastLine(regionId: string, entries: BroadcastEntry[]): string {
  const region = BROADCASTS.regions?.[regionId];
  const prefix = region?.flag ? `${region.flag} ${regionId}` : regionId;
  const channels = entries.map(entry => {
    const suffix = entry.note ? `, ${entry.note}` : '';
    return `${entry.channel} (${entry.type}${suffix})`;
  }).join(', ');

  return `${prefix}: ${channels}`;
}

function getDescription(event: IcsEvent, session: IcsSession): string {
  const meta = SERIES_META[event.seriesId] ?? {
    label: event.seriesId.toUpperCase(),
  };
  const lines = [
    `${meta.label}`,
    `Session: ${session.type}`,
    `Circuit: ${event.circuit.name}`,
  ];

  const location = [event.circuit.city, event.circuit.country].filter(Boolean).join(', ');
  if (location) lines.push(`Location: ${location}`);

  const regionEntries = Object.entries(BROADCASTS.series?.[event.seriesId] ?? {})
    .filter(([, entries]) => entries.length > 0)
    .map(([regionId, entries]) => formatBroadcastLine(regionId, entries));

  if (regionEntries.length > 0) {
    lines.push('', 'Broadcasts:', ...regionEntries);
  }

  return lines.join('\n');
}

function makeVEvent(event: IcsEvent, session: IcsSession): string {
  const dur = SESSION_DURATION_MIN[session.type] ?? 120;
  const location = [event.circuit.name, event.circuit.city, event.circuit.country].filter(Boolean).join(', ');
  const uid = `${event.id}-${session.type.replace(/\s+/g, '')}@racetrack`;

  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${toIcsDate(session.startTimeUTC)}`,
    `DTEND:${toIcsDate(addMinutes(session.startTimeUTC, dur))}`,
    `SUMMARY:${escapeIcs(`${getSeriesSummaryPrefix(event.seriesId)} ${event.eventName} - ${session.type} @ ${event.circuit.name}`)}`,
    `LOCATION:${escapeIcs(location)}`,
    `DESCRIPTION:${escapeIcs(getDescription(event, session))}`,
    'END:VEVENT',
  ].join('\r\n');
}

function makeCalendar(name: string, events: IcsEvent[]): string {
  const vEvents = events.flatMap(ev =>
    ev.sessions
      .filter(s => !s.startTimeUTC.startsWith('1900-'))
      .map(s => makeVEvent(ev, s))
  );

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//RaceTrack//Motorsport Calendar//EN',
    `X-WR-CALNAME:${escapeIcs(name)}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...vEvents,
    'END:VCALENDAR',
  ].join('\r\n');
}

/** Download an .ics file in the browser. */
export function downloadIcs(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Export a single event's race session as .ics. */
export function exportEventIcs(event: IcsEvent): void {
  const raceSessions = event.sessions.filter(s =>
    !s.startTimeUTC.startsWith('1900-') &&
    (s.type === 'Race' || s.type === 'Feature Race')
  );
  const sessions = raceSessions.length > 0 ? raceSessions : event.sessions.filter(s => !s.startTimeUTC.startsWith('1900-'));
  const cal = makeCalendar(event.eventName, [{ ...event, sessions }]);
  const safeName = event.eventName.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  downloadIcs(`${safeName}.ics`, cal);
}

/** Export multiple events as a single .ics file. */
export function exportEventsIcs(name: string, events: IcsEvent[]): void {
  const cal = makeCalendar(name, events);
  const safeName = name.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase();
  downloadIcs(`${safeName}.ics`, cal);
}
