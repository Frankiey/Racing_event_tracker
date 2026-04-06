/** Canonical session type → abbreviated display label. */
export const SESSION_ABBR: Record<string, string> = {
  'Practice 1': 'FP1', 'Practice 2': 'FP2', 'Practice 3': 'FP3',
  'Free Practice 1': 'FP1', 'Free Practice 2': 'FP2', 'Free Practice 3': 'FP3',
  'Sprint Qualifying': 'SQ', 'Sprint Shootout': 'SQ', 'Sprint': 'Sprint',
  'Qualifying': 'Quali', 'Feature Race': 'Race', 'Race': 'Race',
  'Warm Up': 'WU',
};

/** Canonical session type → full display label (for detail/modal views). */
export const SESSION_LABELS: Record<string, string> = {
  'Practice 1': 'FP1', 'Practice 2': 'FP2', 'Practice 3': 'FP3',
  'Free Practice 1': 'FP1', 'Free Practice 2': 'FP2', 'Free Practice 3': 'FP3',
  'Sprint Qualifying': 'Sprint Qualifying', 'Sprint Shootout': 'Sprint Shootout',
  'Sprint': 'Sprint Race', 'Qualifying': 'Qualifying', 'Feature Race': 'Race',
  'Race': 'Race', 'Warm Up': 'Warm Up',
};

/** Canonical session type → estimated duration in minutes. */
export const SESSION_DURATION_MIN: Record<string, number> = {
  Practice: 60,
  'Practice 1': 60,
  'Practice 2': 60,
  'Practice 3': 60,
  'Free Practice 1': 60,
  'Free Practice 2': 60,
  'Free Practice 3': 60,
  FP1: 60,
  FP2: 60,
  FP3: 60,
  Q1: 20,
  Q2: 20,
  Qualifying: 90,
  'Sprint Qualifying': 60,
  'Sprint Shootout': 60,
  Sprint: 45,
  'Sprint Race': 45,
  Race: 120,
  'Race 1': 120,
  'Race 2': 120,
  'Feature Race': 120,
  'Superpole Race': 45,
  'NASCAR Race': 180,
  'MotoGP Race': 60,
  'Warm Up': 30,
};

export const DEFAULT_SESSION_DURATION_MIN = 120;

export function getSessionDurationMinutes(type: string): number {
  return SESSION_DURATION_MIN[type] ?? DEFAULT_SESSION_DURATION_MIN;
}
