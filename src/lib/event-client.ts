import type { RaceEvent } from './types';

export const RT_EVENTS_REGISTERED = 'rt-events-registered';

declare global {
  interface Window {
    __passportFullEvents?: RaceEvent[];
    __rtAllEvents?: RaceEvent[];
    __rtEventRegistry?: Map<string, RaceEvent>;
  }
}

export function registerEvents(events: RaceEvent[]): void {
  const registry = getEventRegistry();
  for (const event of events) registry.set(event.id, event);
  window.__rtAllEvents = events;
  window.dispatchEvent(new CustomEvent(RT_EVENTS_REGISTERED));
}

export function getRegisteredEvent(eventId: string): RaceEvent | undefined {
  const registry = getEventRegistry();
  const cached = registry.get(eventId);
  if (cached) return cached;

  const fallback = window.__rtAllEvents?.find(event => event.id === eventId)
    ?? window.__passportFullEvents?.find(event => event.id === eventId);

  if (fallback) registry.set(eventId, fallback);
  return fallback;
}

export function openEventById(eventId: string): boolean {
  const event = getRegisteredEvent(eventId);
  if (!event) return false;
  window.dispatchEvent(new CustomEvent('rt-open-event', { detail: event }));
  return true;
}

export function bindEventOpeners(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-event-id]').forEach(card => {
    if (card.dataset.eventBound === 'true') return;
    card.dataset.eventBound = 'true';

    const open = () => {
      const eventId = card.dataset.eventId;
      if (eventId) openEventById(eventId);
    };

    card.addEventListener('click', open);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });
}

function getEventRegistry(): Map<string, RaceEvent> {
  if (!window.__rtEventRegistry) window.__rtEventRegistry = new Map();
  return window.__rtEventRegistry;
}