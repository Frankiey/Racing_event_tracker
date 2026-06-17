import { readStoredJson, writeStoredJson } from '../ui/storage';

export const RT_ALERTS_KEY = 'rt-alerts';

export interface StoredAlert {
  eventId: string;
  eventName: string;
  sessionType: string;
  fireAt: string;
  offset: number;
}

function isStoredAlert(value: unknown): value is StoredAlert {
  if (!value || typeof value !== 'object') return false;
  const alert = value as Record<string, unknown>;
  return typeof alert.eventId === 'string'
    && typeof alert.eventName === 'string'
    && typeof alert.sessionType === 'string'
    && typeof alert.fireAt === 'string'
    && typeof alert.offset === 'number';
}

function isStoredAlertArray(value: unknown): value is StoredAlert[] {
  return Array.isArray(value) && value.every(isStoredAlert);
}

export function getStoredAlerts(): StoredAlert[] {
  return readStoredJson(RT_ALERTS_KEY, [], isStoredAlertArray);
}

export function saveStoredAlerts(alerts: StoredAlert[]): void {
  writeStoredJson(RT_ALERTS_KEY, alerts);
}