/**
 * Series metadata: colors, labels, and display order.
 */

export type SeriesCategory = '4-wheel' | '2-wheel';

export interface SeriesMeta {
  id: string;
  label: string;
  shortLabel: string;
  color: string;       // Tailwind-compatible hex color
  order: number;
  category: SeriesCategory;
}

export const SERIES: Record<string, SeriesMeta> = {
  f1:      { id: 'f1',      label: 'Formula 1',   shortLabel: 'F1',       color: '#e10600', order: 1,  category: '4-wheel' },
  f2:      { id: 'f2',      label: 'Formula 2',   shortLabel: 'F2',       color: '#0090d0', order: 2,  category: '4-wheel' },
  f3:      { id: 'f3',      label: 'Formula 3',   shortLabel: 'F3',       color: '#60a5fa', order: 3,  category: '4-wheel' },
  fe:      { id: 'fe',      label: 'Formula E',   shortLabel: 'FE',       color: '#14b8a6', order: 4,  category: '4-wheel' },
  motogp:  { id: 'motogp',  label: 'MotoGP',      shortLabel: 'MotoGP',   color: '#be123c', order: 5,  category: '2-wheel' },
  moto2:   { id: 'moto2',   label: 'Moto2',       shortLabel: 'Moto2',    color: '#f97316', order: 6,  category: '2-wheel' },
  moto3:   { id: 'moto3',   label: 'Moto3',       shortLabel: 'Moto3',    color: '#facc15', order: 7,  category: '2-wheel' },
  indycar: { id: 'indycar', label: 'IndyCar',     shortLabel: 'IndyCar',  color: '#1e40af', order: 8,  category: '4-wheel' },
  nascar:  { id: 'nascar',  label: 'NASCAR',      shortLabel: 'NASCAR',   color: '#eab308', order: 9,  category: '4-wheel' },
  wec:          { id: 'wec',          label: 'WEC',             shortLabel: 'WEC',    color: '#0ea5e9', order: 10, category: '4-wheel' },
  imsa:         { id: 'imsa',         label: 'IMSA',            shortLabel: 'IMSA',   color: '#16a34a', order: 11, category: '4-wheel' },
  dtm:          { id: 'dtm',          label: 'DTM',             shortLabel: 'DTM',    color: '#dc2626', order: 12, category: '4-wheel' },
  nls:          { id: 'nls',          label: 'NLS',             shortLabel: 'NLS',    color: '#65a30d', order: 13, category: '4-wheel' },
  wsbk:         { id: 'wsbk',         label: 'World Superbike', shortLabel: 'WSBK',   color: '#9333ea', order: 14, category: '2-wheel' },
  superformula: { id: 'superformula', label: 'Super Formula',   shortLabel: 'SF',     color: '#f59e0b', order: 15, category: '4-wheel' },
  iomtt:        { id: 'iomtt',        label: 'Isle of Man TT',  shortLabel: 'IOM TT', color: '#92400e', order: 16, category: '2-wheel' },
};

export const SERIES_LIST = Object.values(SERIES).sort((a, b) => a.order - b.order);

export function getSeriesMeta(seriesId: string): SeriesMeta {
  return SERIES[seriesId] ?? { id: seriesId, label: seriesId, shortLabel: seriesId, color: '#71717a', order: 99, category: '4-wheel' as SeriesCategory };
}
