import sessionTaxonomy from './session-taxonomy.json';

type SessionTaxonomyEntry = {
  abbr: string;
  label: string;
  durationMinutes: number;
  isRace: boolean;
};

const SESSION_TAXONOMY = sessionTaxonomy as {
  defaultDurationMinutes: number;
  sessionTypes: Record<string, SessionTaxonomyEntry>;
};

const SESSION_TYPE_ENTRIES = Object.entries(SESSION_TAXONOMY.sessionTypes);

/** Canonical set of session types considered "race" (main event). */
export const RACE_TYPES = new Set(
  SESSION_TYPE_ENTRIES
    .filter(([, meta]) => meta.isRace)
    .map(([type]) => type),
);

/** Check if a session type is a race (the main event of a weekend). */
export function isRaceType(type: string): boolean {
  return RACE_TYPES.has(type);
}

/** Canonical session type → abbreviated display label. */
export const SESSION_ABBR: Record<string, string> = Object.fromEntries(
  SESSION_TYPE_ENTRIES.map(([type, meta]) => [type, meta.abbr]),
);

/** Canonical session type → full display label (for detail/modal views). */
export const SESSION_LABELS: Record<string, string> = Object.fromEntries(
  SESSION_TYPE_ENTRIES.map(([type, meta]) => [type, meta.label]),
);

/** Canonical session type → estimated duration in minutes. */
export const SESSION_DURATION_MIN: Record<string, number> = Object.fromEntries(
  SESSION_TYPE_ENTRIES.map(([type, meta]) => [type, meta.durationMinutes]),
);

export const DEFAULT_SESSION_DURATION_MIN = SESSION_TAXONOMY.defaultDurationMinutes;

export function getSessionDurationMinutes(type: string): number {
  return SESSION_DURATION_MIN[type] ?? DEFAULT_SESSION_DURATION_MIN;
}

export interface SessionTimeLike {
  type: string;
  startTimeUTC: string;
  endTimeUTC?: string;
}

export interface SessionDayGroup<T extends SessionTimeLike> {
  dayKey: string;
  dayLabel: string;
  sessions: T[];
}

export function getSessionEstimatedEndTime(session: SessionTimeLike): number {
  if (session.endTimeUTC) return new Date(session.endTimeUTC).getTime();
  return new Date(session.startTimeUTC).getTime() + getSessionDurationMinutes(session.type) * 60_000;
}

export function getSessionLocalDayKey(utc: string): string {
  const date = new Date(utc);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function formatSessionDayLabel(utc: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(new Date(utc));
}

export function formatSessionTime(utc: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utc));
}

export function isSessionLiveAt(session: SessionTimeLike, now = Date.now(), graceMs = 0): boolean {
  const start = new Date(session.startTimeUTC).getTime();
  return now >= start && now < getSessionEstimatedEndTime(session) + graceMs;
}

export function isSessionPastAt(session: SessionTimeLike, now = Date.now(), graceMs = 0): boolean {
  return now >= getSessionEstimatedEndTime(session) + graceMs;
}

export function isSessionTodayAt(session: SessionTimeLike, now = new Date()): boolean {
  const sessionDate = new Date(session.startTimeUTC);
  return sessionDate.getFullYear() === now.getFullYear()
    && sessionDate.getMonth() === now.getMonth()
    && sessionDate.getDate() === now.getDate();
}

export function getNextSession<T extends SessionTimeLike>(sessions: T[], now = Date.now()): T | null {
  return sessions.find(session => new Date(session.startTimeUTC).getTime() > now) ?? null;
}

export function groupSessionsByLocalDay<T extends SessionTimeLike>(sessions: T[]): SessionDayGroup<T>[] {
  return sessions.reduce<SessionDayGroup<T>[]>((groups, session) => {
    const dayKey = getSessionLocalDayKey(session.startTimeUTC);
    const current = groups.at(-1);
    if (current && current.dayKey === dayKey) {
      current.sessions.push(session);
      return groups;
    }

    groups.push({
      dayKey,
      dayLabel: formatSessionDayLabel(session.startTimeUTC),
      sessions: [session],
    });
    return groups;
  }, []);
}

export function sessionsOnLocalDate<T extends SessionTimeLike>(sessions: T[], dateStr: string): T[] {
  return sessions.filter(session => getSessionLocalDayKey(session.startTimeUTC) === dateStr);
}
