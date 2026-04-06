/**
 * Time formatting helpers. All inputs are UTC ISO strings.
 * Actual local-time conversion happens in the browser.
 */
export { countryFlag, formatDateRange, isPastEvent, isPlaceholderTime } from './time-format';

/** Get the main race session from an event's sessions array. */
export function getRaceSession(sessions: { type: string; startTimeUTC: string }[]): { type: string; startTimeUTC: string } | undefined {
  const raceTypes = ['Race', 'Feature Race', 'Race 2', 'Race 1', 'Sprint Race', 'Superpole Race', 'Sprint'];
  return sessions.find(s => raceTypes.includes(s.type))
    ?? sessions[sessions.length - 1];
}
