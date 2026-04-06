import type { RaceEvent } from './types';

export const RT_EVENTS_REGISTERED = 'rt-events-registered';

/** Unified RaceTrack namespace on window — avoids polluting global scope. */
declare global {
  interface Window {
    __rt?: {
      allEvents?: RaceEvent[];
      eventRegistry?: Map<string, RaceEvent>;
      renderTimeline?: (event: RaceEvent) => void;
      favsHandler?: EventListener;
    };
  }
}

function rt(): NonNullable<Window['__rt']> {
  if (!window.__rt) window.__rt = {};
  return window.__rt;
}

export function registerEvents(events: RaceEvent[]): void {
  const registry = getEventRegistry();
  for (const event of events) registry.set(event.id, event);
  rt().allEvents = events;
  window.dispatchEvent(new CustomEvent(RT_EVENTS_REGISTERED));
}

export function getRegisteredEvent(eventId: string): RaceEvent | undefined {
  const registry = getEventRegistry();
  const cached = registry.get(eventId);
  if (cached) return cached;

  const fallback = rt().allEvents?.find(event => event.id === eventId);
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
  const ns = rt();
  if (!ns.eventRegistry) ns.eventRegistry = new Map();
  return ns.eventRegistry;
}