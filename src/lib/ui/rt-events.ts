import type { RaceEvent } from '../types';

export const RT_OPEN_EVENT = 'rt-open-event';
export const RT_FAVS_CHANGED = 'rt-favs-changed';
export const RT_FILTERS_CHANGED = 'rt-filters-changed';
export const RT_EVENTS_REGISTERED = 'rt-events-registered';

export interface FiltersChangedDetail {
  active: string[];
}

export function emitOpenEvent(event: RaceEvent): void {
  window.dispatchEvent(new CustomEvent<RaceEvent>(RT_OPEN_EVENT, { detail: event }));
}

export function emitFavoritesChanged(): void {
  window.dispatchEvent(new CustomEvent(RT_FAVS_CHANGED));
}

export function emitFiltersChanged(detail: FiltersChangedDetail): void {
  window.dispatchEvent(new CustomEvent<FiltersChangedDetail>(RT_FILTERS_CHANGED, { detail }));
}

export function emitEventsRegistered(): void {
  window.dispatchEvent(new CustomEvent(RT_EVENTS_REGISTERED));
}

export function onOpenEvent(listener: (event: RaceEvent) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<RaceEvent>).detail);
  window.addEventListener(RT_OPEN_EVENT, handler);
  return () => window.removeEventListener(RT_OPEN_EVENT, handler);
}

export function onFavoritesChanged(listener: EventListener): () => void {
  window.addEventListener(RT_FAVS_CHANGED, listener);
  return () => window.removeEventListener(RT_FAVS_CHANGED, listener);
}

export function onFiltersChanged(listener: (detail: FiltersChangedDetail) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<FiltersChangedDetail>).detail);
  window.addEventListener(RT_FILTERS_CHANGED, handler);
  return () => window.removeEventListener(RT_FILTERS_CHANGED, handler);
}

export function onEventsRegistered(listener: EventListener): () => void {
  window.addEventListener(RT_EVENTS_REGISTERED, listener);
  return () => window.removeEventListener(RT_EVENTS_REGISTERED, listener);
}