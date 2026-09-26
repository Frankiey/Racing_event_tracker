import { isPlaceholderTime } from '../time';
import { getSessionEstimatedEndTime, isSessionLiveAt, type SessionTimeLike } from '../sessions';

export interface KioskSession extends SessionTimeLike {
  endTimeUTC?: string;
}

export interface KioskEvent {
  id: string;
  seriesId: string;
  eventName: string;
  round: number;
  circuit: {
    name: string;
    city: string;
    country: string;
    countryCode: string;
    lengthKm?: number;
    lapRecord?: { time: string; driver: string; year: number };
  };
  sessions: KioskSession[];
  dateStart: string;
  dateEnd: string;
}

/** 'empty' = nothing left to show (off-season, or the whole feed is in the past). */
export type KioskMode = 'idle' | 'weekend' | 'live' | 'empty';

export interface LiveHit {
  event: KioskEvent;
  session: KioskSession;
}

export interface ModeResult {
  mode: KioskMode;
  event: KioskEvent | null;
  session: KioskSession | null;
  alsoLive: LiveHit[];
  /** Every live session, favorites first then series order (empty unless mode is 'live'). */
  live: LiveHit[];
  /** How many leading `live` hits take turns as the hero: the favorites if any are live, else all. */
  livePoolSize: number;
}

export interface RotationState {
  events: KioskEvent[];
  index: number;
}

export interface ManualSelectionState {
  eventId: string | null;
  expiresAt: number;
}

export const KIOSK_MANUAL_TIMEOUT_MS = 60_000;

/** Same liveness definition as the main page (isSessionLiveAt, no grace) so the kiosk
 * and the dashboard can never disagree about whether a session is running. */
export function isKioskSessionLive(session: KioskSession, now: number): boolean {
  return !isPlaceholderTime(session.startTimeUTC) && isSessionLiveAt(session, now);
}

/** Earliest instant after `now` at which any session starts or ends — i.e. the next moment
 * the kiosk's mode/hero/session strip can change. The page compares this against the clock
 * every second so a session ending flips the display immediately, not on the next 30s refresh. */
export function getNextKioskTransition(events: KioskEvent[], now: number): number | null {
  let next: number | null = null;
  for (const event of events) {
    for (const session of event.sessions) {
      if (isPlaceholderTime(session.startTimeUTC)) continue;
      for (const t of [new Date(session.startTimeUTC).getTime(), getSessionEstimatedEndTime(session)]) {
        if (t > now && (next === null || t < next)) next = t;
      }
    }
  }
  return next;
}

export function getNextKioskEvent(events: KioskEvent[], now: number): KioskEvent | null {
  return events.find((event) =>
    event.sessions.some((session) => !isPlaceholderTime(session.startTimeUTC) && new Date(session.startTimeUTC).getTime() > now),
  ) ?? null;
}

export function getKioskMode(
  events: KioskEvent[],
  now: number,
  getOrder: (seriesId: string) => number,
  favoriteEventIds: ReadonlySet<string> = new Set(),
): ModeResult {
  const liveHits: LiveHit[] = [];
  for (const event of events) {
    for (const session of event.sessions) {
      if (!isPlaceholderTime(session.startTimeUTC) && isKioskSessionLive(session, now)) {
        liveHits.push({ event, session });
      }
    }
  }

  if (liveHits.length > 0) {
    const fav = (hit: LiveHit) => (favoriteEventIds.has(hit.event.id) ? 0 : 1);
    liveHits.sort((left, right) => fav(left) - fav(right) || getOrder(left.event.seriesId) - getOrder(right.event.seriesId));
    const primary = liveHits[0];
    const livePoolSize = liveHits.filter((hit) => fav(hit) === fav(primary)).length;
    return { mode: 'live', event: primary.event, session: primary.session, alsoLive: liveHits.slice(1), live: liveHits, livePoolSize };
  }

  const next = getNextKioskEvent(events, now);
  if (!next) return { mode: 'empty', event: null, session: null, alsoLive: [], live: [], livePoolSize: 0 };

  return { mode: isKioskWeekendEvent(next, now) ? 'weekend' : 'idle', event: next, session: null, alsoLive: [], live: [], livePoolSize: 0 };
}

/** Live mode with several sessions on air: make `live[index % livePoolSize]` the hero and the rest
 * "also live" chips. Non-live results pass through untouched. */
export function rotateLiveResult(result: ModeResult, index: number): ModeResult {
  if (result.mode !== 'live' || result.livePoolSize < 2) return result;
  const primary = result.live[index % result.livePoolSize];
  return { ...result, event: primary.event, session: primary.session, alsoLive: result.live.filter((hit) => hit !== primary) };
}

export const KIOSK_WEEKEND_WINDOW_DAYS = 7;

/** True when the event is within the weekend window or already under way (dateStart in the past). */
export function isKioskWeekendEvent(event: KioskEvent, now: number): boolean {
  return (new Date(event.dateStart).getTime() - now) / 86_400_000 <= KIOSK_WEEKEND_WINDOW_DAYS;
}

/** Mode to render for the event actually on screen. The auto mode is computed from the NEXT
 * event, but the hero may show a rotation-pool or manually picked event weeks away — weekend
 * styling ("This Weekend", session countdown) must only apply to an event that earns it. */
export function getKioskRenderMode(
  autoResult: ModeResult,
  event: KioskEvent | null,
  isManual: boolean,
  now: number,
): KioskMode {
  if (!event) return 'empty';
  if (isManual) return 'idle';
  if (autoResult.mode === 'live') return 'live';
  return isKioskWeekendEvent(event, now) ? 'weekend' : 'idle';
}

export function getNextKioskSession(event: KioskEvent, now: number): KioskSession | null {
  return event.sessions.find((session) => !isPlaceholderTime(session.startTimeUTC) && new Date(session.startTimeUTC).getTime() > now) ?? null;
}

export function updateRotationState(
  previous: RotationState,
  events: KioskEvent[],
  now: number,
  poolSize: number,
): RotationState {
  const upcoming = events
    .filter((event) => event.sessions.some((session) => !isPlaceholderTime(session.startTimeUTC) && new Date(session.startTimeUTC).getTime() > now))
    .slice(0, poolSize);

  if (upcoming[0]?.id !== previous.events[0]?.id || upcoming.length !== previous.events.length) {
    return { events: upcoming, index: 0 };
  }

  return {
    events: upcoming,
    index: previous.index >= upcoming.length ? 0 : previous.index,
  };
}

export function createManualSelection(id: string, now = Date.now(), timeoutMs = KIOSK_MANUAL_TIMEOUT_MS): ManualSelectionState {
  return { eventId: id, expiresAt: now + timeoutMs };
}

export function clearManualSelection(): ManualSelectionState {
  return { eventId: null, expiresAt: 0 };
}

export function resolveKioskEvent(
  autoResult: ModeResult,
  events: KioskEvent[],
  rotationState: RotationState,
  manualState: ManualSelectionState,
  now = Date.now(),
): { event: KioskEvent | null; isManual: boolean; manualState: ManualSelectionState } {
  if (manualState.eventId && now < manualState.expiresAt) {
    const found = events.find((event) => event.id === manualState.eventId);
    if (found) return { event: found, isManual: true, manualState };
  }

  const cleared = clearManualSelection();
  if (autoResult.mode === 'live') return { event: autoResult.event, isManual: false, manualState: cleared };
  if (rotationState.events.length > 0) {
    return { event: rotationState.events[rotationState.index], isManual: false, manualState: cleared };
  }
  return { event: autoResult.event, isManual: false, manualState: cleared };
}

/** "Round 12 / 14" — total is the SEASON's round count (calendar), never the number of
 * events left in the feed. Falls back to "Round 12" when the total is unknown or implausible. */
export function formatKioskRound(round: number, total: number | undefined): string {
  return total && total >= round ? `Round ${round} / ${total}` : `Round ${round}`;
}

/** Compact "2d 4h" / "3h 05m" / "12m" for the live-mode "next session" line. Clamped at 0. */
export function formatKioskDuration(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(totalMin / 1440);
  const h = Math.floor((totalMin % 1440) / 60);
  const m = totalMin % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return totalMin < 1 ? '<1m' : `${m}m`;
}

// ── Data freshness (jwt3.14) ─────────────────────────────────────────────────

/** Data generated more than this long ago is flagged as possibly stale (pipeline runs daily). */
export const KIOSK_STALE_MS = 36 * 3_600_000;
/** Consecutive failed refreshes before the kiosk says it may be offline. */
export const KIOSK_MAX_FAILURES = 3;

export type KioskFreshness = 'fresh' | 'offline' | 'old';

/** Identity of a published feed: its `generated` stamp, so ANY regeneration (reschedules, new
 * sessions, changed times) is noticed — not just a changed event count/first id. Falls back to
 * count + first id for a bare-array feed with no envelope. */
export function getKioskFingerprint(feed: { generated?: string; events?: { id: string }[] } | { id: string }[]): string {
  const generated = Array.isArray(feed) ? undefined : feed.generated;
  if (generated) return generated;
  const events = Array.isArray(feed) ? feed : feed.events ?? [];
  return `${events.length}-${events[0]?.id ?? ''}`;
}

export function getKioskFreshness(generated: string | null | undefined, now: number, consecutiveFailures: number): KioskFreshness {
  if (consecutiveFailures >= KIOSK_MAX_FAILURES) return 'offline';
  const generatedMs = generated ? new Date(generated).getTime() : NaN;
  if (!Number.isNaN(generatedMs) && now - generatedMs > KIOSK_STALE_MS) return 'old';
  return 'fresh';
}

// ── Burn-in protection (jwt3.15) ─────────────────────────────────────────────

/** Whole-content offsets (px) the kiosk steps through so static high-contrast elements never sit on
 * the same pixels for hours. Small enough to be invisible as a "move", big enough to spread wear. */
const KIOSK_SHIFT_STEPS: readonly (readonly [number, number])[] = [[0, 0], [5, 3], [-4, 5], [-5, -3], [3, -5]];
export const KIOSK_SHIFT_INTERVAL_MS = 5 * 60_000;

/** Offset for the current time: stateless (derived from the clock), so any timer/reload agrees. */
export function getKioskShift(now: number): { x: number; y: number } {
  const [x, y] = KIOSK_SHIFT_STEPS[Math.floor(now / KIOSK_SHIFT_INTERVAL_MS) % KIOSK_SHIFT_STEPS.length];
  return { x, y };
}

// ── Legibility (jwt3.20) ─────────────────────────────────────────────────────

/** Black or white, whichever reads better on the given `#rrggbb` series colour (yellow badges with
 * white text are unreadable from across a room). 0.179 is the WCAG luminance where both contrast equally. */
export function getReadableTextColor(hex: string): '#ffffff' | '#09090b' {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.179 ? '#09090b' : '#ffffff';
}

// ── Trivia (jwt3.10) ─────────────────────────────────────────────────────────

/** "6.003 km · Lap record 1:43.009 Charles Leclerc (2019)" from whatever real circuit data exists;
 * null when there is none (most circuits) so the line stays hidden — never a placeholder. */
export function getKioskTrivia(circuit: KioskEvent['circuit']): string | null {
  const parts: string[] = [];
  if (circuit.lengthKm) parts.push(`${circuit.lengthKm} km`);
  const r = circuit.lapRecord;
  if (r?.time) parts.push(`Lap record ${r.time}${r.driver ? ` ${r.driver}` : ''}${r.year ? ` (${r.year})` : ''}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}
