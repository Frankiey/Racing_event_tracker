import { isRaceType } from '../sessions';
import type { RaceEvent, RaceSession } from '../types';
import type { StoredAlert } from './alert-store';

export function getAlertRaceSession(event: RaceEvent | null): RaceSession | null {
  if (!event) return null;
  return event.sessions?.find((session) => isRaceType(session.type)) ?? null;
}

export function shouldShowAlertSection(event: RaceEvent | null, now = Date.now()): boolean {
  const race = getAlertRaceSession(event);
  if (!race) return false;
  return new Date(race.startTimeUTC).getTime() >= now;
}

export function findEventAlert(alerts: StoredAlert[], eventId: string): StoredAlert | undefined {
  return alerts.find((alert) => alert.eventId === eventId);
}

export function buildStoredAlert(event: RaceEvent, race: RaceSession, offset: number): StoredAlert {
  return {
    eventId: event.id,
    eventName: event.eventName,
    sessionType: race.type,
    fireAt: new Date(new Date(race.startTimeUTC).getTime() - offset * 60_000).toISOString(),
    offset,
  };
}

export function partitionDueAlerts(alerts: StoredAlert[], now = Date.now()): {
  due: StoredAlert[];
  remaining: StoredAlert[];
} {
  return alerts.reduce<{ due: StoredAlert[]; remaining: StoredAlert[] }>((result, alert) => {
    if (new Date(alert.fireAt).getTime() <= now) result.due.push(alert);
    else result.remaining.push(alert);
    return result;
  }, { due: [], remaining: [] });
}