import type {
  PassportEvent,
  PassportRenderState,
  PassportSeriesMetaMap,
  ProjectedPassportEvent,
} from './types';

export function filterPassportEvents(events: PassportEvent[], activeFilter: string): PassportEvent[] {
  if (activeFilter === 'all') return events;
  return events.filter((event) => event.seriesId === activeFilter);
}

export function getFlightRoute(events: PassportEvent[], flightSeries: string): PassportEvent[] {
  return events
    .filter((event) => event.seriesId === flightSeries)
    .sort((left, right) => left.round - right.round);
}

export function updatePassportFlightState(state: PassportRenderState, events: PassportEvent[]): void {
  const route = getFlightRoute(events, state.flightSeries);
  state.flightActive = route.length >= 2;
  if (!state.flightActive) {
    state.flightProgress = 0;
    state.lastFlightSegIndex = -1;
  }
}

export function setPassportFlightSeries(state: PassportRenderState, sid: string, events: PassportEvent[]): void {
  if (sid === state.flightSeries) return;
  state.flightSeries = sid;
  state.flightProgress = 0;
  state.lastFlightSegIndex = -1;
  updatePassportFlightState(state, events);
}

export function findNearestProjectedEvent(
  projectedDots: ProjectedPassportEvent[],
  x: number,
  y: number,
  maxDistance: number,
): ProjectedPassportEvent | null {
  let best: ProjectedPassportEvent | null = null;
  let bestDistance = maxDistance;
  for (const event of projectedDots) {
    const dx = event.px - x;
    const dy = event.py - y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = event;
    }
  }
  return best;
}

export function renderPassportStats(events: PassportEvent[], activeFilter: string): string {
  const filtered = filterPassportEvents(events, activeFilter);
  const done = filtered.filter((event) => event.isPast).length;
  const total = filtered.length;
  const countries = new Set(filtered.map((event) => event.country)).size;
  const circuits = new Set(filtered.map((event) => event.circuit)).size;

  return `
    <div>${done}/${total} rounds</div>
    <div>${countries} countries</div>
    <div>${circuits} circuits</div>
  `;
}

export function renderPassportTooltip(event: PassportEvent, meta: PassportSeriesMetaMap): string {
  const color = meta[event.seriesId]?.color ?? '#71717a';
  const label = meta[event.seriesId]?.shortLabel ?? event.seriesId;
  const dateStr = new Date(event.dateStart + 'T12:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `
    <div class="flex items-center gap-1.5 mb-1">
      <span class="w-2 h-2 rounded-full" style="background:${color}"></span>
      <span class="text-[10px] font-bold uppercase tracking-wide" style="color:${color}">${label}</span>
      <span class="text-[10px] text-zinc-600 font-mono">R${event.round}</span>
    </div>
    <p class="text-sm font-semibold text-zinc-100">${event.name}</p>
    <p class="text-xs text-zinc-400">${event.circuit}</p>
    <p class="text-[10px] text-zinc-500 mt-1">${dateStr} · ${event.country}</p>
  `;
}

export function applyPassportFilterButtonState(filter: string): void {
  document.querySelectorAll('.passport-filter-btn').forEach((button) => {
    if ((button as HTMLElement).dataset.filter === filter) {
      button.classList.add('bg-zinc-800', 'text-zinc-200', 'border-zinc-700');
      button.classList.remove('text-zinc-500', 'border-zinc-800');
    } else {
      button.classList.remove('bg-zinc-800', 'text-zinc-200', 'border-zinc-700');
      button.classList.add('text-zinc-500', 'border-zinc-800');
    }
  });
}

export function applyPassportFlightSeriesButtonState(flightSeries: string): void {
  document.querySelectorAll<HTMLElement>('.flight-series-btn').forEach((button) => {
    const isActive = button.dataset.flightSeries === flightSeries;
    button.classList.toggle('bg-zinc-800', isActive);
    button.classList.toggle('text-zinc-200', isActive);
    button.classList.toggle('border-zinc-600', isActive);
    button.classList.toggle('text-zinc-600', !isActive);
    button.classList.toggle('border-zinc-800', !isActive);
  });
}