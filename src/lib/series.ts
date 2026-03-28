/**
 * Series metadata: colors, labels, and display order.
 */

export type SeriesCategory = '4-wheel' | '2-wheel';

export interface SeriesMeta {
  id: string;
  label: string;
  shortLabel: string;
  color: string;       // Tailwind-compatible hex color
  textClass: string;    // Tailwind text color class
  bgClass: string;      // Tailwind bg color class
  order: number;
  category: SeriesCategory;
}

export const SERIES: Record<string, SeriesMeta> = {
  f1:      { id: 'f1',      label: 'Formula 1',   shortLabel: 'F1',       color: '#e10600', textClass: 'text-red-500',     bgClass: 'bg-red-500',     order: 1,  category: '4-wheel' },
  f2:      { id: 'f2',      label: 'Formula 2',   shortLabel: 'F2',       color: '#0090d0', textClass: 'text-blue-400',    bgClass: 'bg-blue-400',    order: 2,  category: '4-wheel' },
  f3:      { id: 'f3',      label: 'Formula 3',   shortLabel: 'F3',       color: '#60a5fa', textClass: 'text-blue-300',    bgClass: 'bg-blue-300',    order: 3,  category: '4-wheel' },
  fe:      { id: 'fe',      label: 'Formula E',   shortLabel: 'FE',       color: '#14b8a6', textClass: 'text-teal-400',    bgClass: 'bg-teal-400',    order: 4,  category: '4-wheel' },
  motogp:  { id: 'motogp',  label: 'MotoGP',      shortLabel: 'MotoGP',   color: '#be123c', textClass: 'text-rose-600',    bgClass: 'bg-rose-600',    order: 5,  category: '2-wheel' },
  moto2:   { id: 'moto2',   label: 'Moto2',       shortLabel: 'Moto2',    color: '#f97316', textClass: 'text-orange-400',  bgClass: 'bg-orange-400',  order: 6,  category: '2-wheel' },
  moto3:   { id: 'moto3',   label: 'Moto3',       shortLabel: 'Moto3',    color: '#facc15', textClass: 'text-yellow-400',  bgClass: 'bg-yellow-400',  order: 7,  category: '2-wheel' },
  indycar: { id: 'indycar', label: 'IndyCar',     shortLabel: 'IndyCar',  color: '#1e40af', textClass: 'text-blue-700',    bgClass: 'bg-blue-700',    order: 8,  category: '4-wheel' },
  nascar:  { id: 'nascar',  label: 'NASCAR',      shortLabel: 'NASCAR',   color: '#eab308', textClass: 'text-yellow-500',  bgClass: 'bg-yellow-500',  order: 9,  category: '4-wheel' },
  wec:          { id: 'wec',          label: 'WEC',             shortLabel: 'WEC',    color: '#0ea5e9', textClass: 'text-sky-400',    bgClass: 'bg-sky-400',    order: 10, category: '4-wheel' },
  imsa:         { id: 'imsa',         label: 'IMSA',            shortLabel: 'IMSA',   color: '#16a34a', textClass: 'text-green-600',  bgClass: 'bg-green-600',  order: 11, category: '4-wheel' },
  dtm:          { id: 'dtm',          label: 'DTM',             shortLabel: 'DTM',    color: '#dc2626', textClass: 'text-red-600',    bgClass: 'bg-red-600',    order: 12, category: '4-wheel' },
  nls:          { id: 'nls',          label: 'NLS',             shortLabel: 'NLS',    color: '#65a30d', textClass: 'text-lime-600',   bgClass: 'bg-lime-600',   order: 13, category: '4-wheel' },
  wsbk:         { id: 'wsbk',         label: 'World Superbike', shortLabel: 'WSBK',   color: '#9333ea', textClass: 'text-purple-600', bgClass: 'bg-purple-600', order: 14, category: '2-wheel' },
  superformula: { id: 'superformula', label: 'Super Formula',   shortLabel: 'SF',     color: '#f59e0b', textClass: 'text-amber-500',  bgClass: 'bg-amber-500',  order: 15, category: '4-wheel' },
};

export const SERIES_LIST = Object.values(SERIES).sort((a, b) => a.order - b.order);

export function getSeriesMeta(seriesId: string): SeriesMeta {
  return SERIES[seriesId] ?? { id: seriesId, label: seriesId, shortLabel: seriesId, color: '#71717a', textClass: 'text-zinc-500', bgClass: 'bg-zinc-500', order: 99 };
}
