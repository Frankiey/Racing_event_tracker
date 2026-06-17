import { isPlaceholderTime } from '../time';
import { getSessionEstimatedEndTime, type SessionTimeLike } from '../sessions';

export interface KioskSession extends SessionTimeLike {
  endTimeUTC?: string;
}

export interface KioskEvent {
  id: string;
  seriesId: string;
  eventName: string;
  round: number;
  circuit: { name: string; city: string; country: string; countryCode: string };
  sessions: KioskSession[];
  dateStart: string;
  dateEnd: string;
}

export type KioskMode = 'idle' | 'weekend' | 'live';

export interface ModeResult {
  mode: KioskMode;
  event: KioskEvent | null;
  session: KioskSession | null;
  alsoLive: { event: KioskEvent; session: KioskSession }[];
}

export interface RotationState {
  events: KioskEvent[];
  index: number;
}

export interface ManualSelectionState {
  eventId: string | null;
  expiresAt: number;
}

export const KIOSK_GRACE_MS = 30 * 60_000;
export const KIOSK_MANUAL_TIMEOUT_MS = 60_000;

export function isKioskSessionLive(session: KioskSession, now: number, graceMs = KIOSK_GRACE_MS): boolean {
  if (isPlaceholderTime(session.startTimeUTC)) return false;
  const start = new Date(session.startTimeUTC).getTime();
  return now >= start && now < getSessionEstimatedEndTime(session) + graceMs;
}

export function getNextKioskEvent(events: KioskEvent[], now: number): KioskEvent | null {
  return events.find((event) =>
    event.sessions.some((session) => !isPlaceholderTime(session.startTimeUTC) && new Date(session.startTimeUTC).getTime() > now),
  ) ?? null;
}

export function getKioskMode(events: KioskEvent[], now: number, getOrder: (seriesId: string) => number): ModeResult {
  const liveHits: { event: KioskEvent; session: KioskSession }[] = [];
  for (const event of events) {
    for (const session of event.sessions) {
      if (!isPlaceholderTime(session.startTimeUTC) && isKioskSessionLive(session, now)) {
        liveHits.push({ event, session });
      }
    }
  }

  if (liveHits.length > 0) {
    liveHits.sort((left, right) => getOrder(left.event.seriesId) - getOrder(right.event.seriesId));
    const primary = liveHits[0];
    return { mode: 'live', event: primary.event, session: primary.session, alsoLive: liveHits.slice(1) };
  }

  const next = getNextKioskEvent(events, now);
  if (!next) return { mode: 'idle', event: null, session: null, alsoLive: [] };

  const daysUntil = (new Date(next.dateStart).getTime() - now) / 86_400_000;
  if (daysUntil <= 7) return { mode: 'weekend', event: next, session: null, alsoLive: [] };
  return { mode: 'idle', event: next, session: null, alsoLive: [] };
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