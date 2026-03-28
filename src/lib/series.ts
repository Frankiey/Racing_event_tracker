/**
 * Series metadata: colors, labels, and display order.
 */

export interface SeriesMeta {
  id: string;
  label: string;
  shortLabel: string;
  color: string;       // Tailwind-compatible hex color
  textClass: string;    // Tailwind text color class
  bgClass: string;      // Tailwind bg color class
  order: number;
}

export const SERIES: Record<string, SeriesMeta> = {
  f1:      { id: 'f1',      label: 'Formula 1',   shortLabel: 'F1',       color: '#e10600', textClass: 'text-red-500',     bgClass: 'bg-red-500',     order: 1 },
  f2:      { id: 'f2',      label: 'Formula 2',   shortLabel: 'F2',       color: '#0090d0', textClass: 'text-blue-400',    bgClass: 'bg-blue-400',    order: 2 },
  f3:      { id: 'f3',      label: 'Formula 3',   shortLabel: 'F3',       color: '#60a5fa', textClass: 'text-blue-300',    bgClass: 'bg-blue-300',    order: 3 },
  fe:      { id: 'fe',      label: 'Formula E',   shortLabel: 'FE',       color: '#14b8a6', textClass: 'text-teal-400',    bgClass: 'bg-teal-400',    order: 4 },
  motogp:  { id: 'motogp',  label: 'MotoGP',      shortLabel: 'MotoGP',   color: '#be123c', textClass: 'text-rose-600',    bgClass: 'bg-rose-600',    order: 5 },
  moto2:   { id: 'moto2',   label: 'Moto2',       shortLabel: 'Moto2',    color: '#f97316', textClass: 'text-orange-400',  bgClass: 'bg-orange-400',  order: 6 },
  moto3:   { id: 'moto3',   label: 'Moto3',       shortLabel: 'Moto3',    color: '#facc15', textClass: 'text-yellow-400',  bgClass: 'bg-yellow-400',  order: 7 },
  indycar: { id: 'indycar', label: 'IndyCar',     shortLabel: 'IndyCar',  color: '#1e40af', textClass: 'text-blue-700',    bgClass: 'bg-blue-700',    order: 8 },
  nascar:  { id: 'nascar',  label: 'NASCAR',      shortLabel: 'NASCAR',   color: '#eab308', textClass: 'text-yellow-500',  bgClass: 'bg-yellow-500',  order: 9 },
  wec:     { id: 'wec',     label: 'WEC',         shortLabel: 'WEC',      color: '#0ea5e9', textClass: 'text-sky-400',     bgClass: 'bg-sky-400',     order: 10 },
};

export const SERIES_LIST = Object.values(SERIES).sort((a, b) => a.order - b.order);

export function getSeriesMeta(seriesId: string): SeriesMeta {
  return SERIES[seriesId] ?? { id: seriesId, label: seriesId, shortLabel: seriesId, color: '#71717a', textClass: 'text-zinc-500', bgClass: 'bg-zinc-500', order: 99 };
}
