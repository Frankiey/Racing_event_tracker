/** Owner decision (jwt3.22): the kiosk's default broadcast region is the Netherlands. */
export const KIOSK_DEFAULT_REGION = 'NL';

export interface KioskConfig {
  /** Key into broadcasts.json `regions` / per-series maps. */
  region: string;
  /** Series ids to show, or null for all. */
  series: string[] | null;
}

/** Parse `?region=US&series=f1,motogp` (bookmarkable on a kiosk whose localStorage differs from the
 * owner's browser). Anything unknown falls back to the default: unknown region → NL, no valid
 * series → all series. */
export function parseKioskConfig(search: string, validSeries: string[], validRegions: string[]): KioskConfig {
  const params = new URLSearchParams(search);
  const region = (params.get('region') ?? '').trim().toUpperCase();
  const series = (params.get('series') ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s, i, all) => validSeries.includes(s) && all.indexOf(s) === i);
  return {
    region: validRegions.includes(region) ? region : KIOSK_DEFAULT_REGION,
    series: series.length > 0 ? series : null,
  };
}

export function filterKioskEvents<T extends { seriesId: string }>(events: T[], series: string[] | null): T[] {
  return series ? events.filter((e) => series.includes(e.seriesId)) : events;
}
