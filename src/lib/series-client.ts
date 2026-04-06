/**
 * Client-side series metadata — re-exports from the canonical series.ts.
 * Kept as a separate module for backwards compatibility; new code should
 * import directly from './series'.
 */
import { SERIES, SERIES_LIST, getSeriesMeta } from './series';
import type { SeriesMeta } from './series';
export type { SeriesCategory } from './series';

/** @deprecated Use `SeriesMeta` from './series' */
export type ClientSeriesMeta = SeriesMeta;

/** Direct alias — clients can look up any series by id. */
export const SERIES_META = SERIES;

/** Series ids sorted by display order. */
export const SERIES_ORDER: string[] = SERIES_LIST.map(s => s.id);

/** @deprecated Use `getSeriesMeta` from './series' */
export const getClientSeriesMeta = getSeriesMeta;
