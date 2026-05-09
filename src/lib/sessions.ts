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
