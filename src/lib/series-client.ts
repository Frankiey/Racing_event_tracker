/**
 * Client-side series metadata — derived from the canonical series.ts definitions.
 * This eliminates duplication: series.ts is the single source of truth.
 */
import { SERIES, SERIES_LIST } from './series';
import type { SeriesCategory } from './series';

export interface ClientSeriesMeta {
  label: string;
  shortLabel: string;
  color: string;
  category: SeriesCategory;
}

export const SERIES_META: Record<string, ClientSeriesMeta> = Object.fromEntries(
  Object.entries(SERIES).map(([id, meta]) => [
    id,
    { label: meta.label, shortLabel: meta.shortLabel, color: meta.color, category: meta.category },
  ])
);

export const SERIES_ORDER: string[] = SERIES_LIST.map(s => s.id);
