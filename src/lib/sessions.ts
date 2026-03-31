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
