import type { SeriesCategory } from './series';

export interface ClientSeriesMeta {
  label: string;
  shortLabel: string;
  color: string;
  category: SeriesCategory;
}

export const SERIES_META: Record<string, ClientSeriesMeta> = {
  f1:           { label: 'Formula 1',      shortLabel: 'F1',       color: '#e10600', category: '4-wheel' },
  f2:           { label: 'Formula 2',      shortLabel: 'F2',       color: '#0090d0', category: '4-wheel' },
  f3:           { label: 'Formula 3',      shortLabel: 'F3',       color: '#60a5fa', category: '4-wheel' },
  fe:           { label: 'Formula E',      shortLabel: 'FE',       color: '#14b8a6', category: '4-wheel' },
  motogp:       { label: 'MotoGP',         shortLabel: 'MotoGP',   color: '#be123c', category: '2-wheel' },
  moto2:        { label: 'Moto2',          shortLabel: 'Moto2',    color: '#f97316', category: '2-wheel' },
  moto3:        { label: 'Moto3',          shortLabel: 'Moto3',    color: '#facc15', category: '2-wheel' },
  indycar:      { label: 'IndyCar',        shortLabel: 'IndyCar',  color: '#1e40af', category: '4-wheel' },
  nascar:       { label: 'NASCAR',         shortLabel: 'NASCAR',   color: '#eab308', category: '4-wheel' },
  wec:          { label: 'WEC',            shortLabel: 'WEC',      color: '#0ea5e9', category: '4-wheel' },
  imsa:         { label: 'IMSA',           shortLabel: 'IMSA',     color: '#16a34a', category: '4-wheel' },
  dtm:          { label: 'DTM',            shortLabel: 'DTM',      color: '#dc2626', category: '4-wheel' },
  nls:          { label: 'NLS',            shortLabel: 'NLS',      color: '#65a30d', category: '4-wheel' },
  wsbk:         { label: 'World Superbike', shortLabel: 'WSBK',    color: '#9333ea', category: '2-wheel' },
  superformula: { label: 'Super Formula',  shortLabel: 'SF',       color: '#f59e0b', category: '4-wheel' },
};

export const SERIES_ORDER = [
  'f1', 'f2', 'f3', 'fe', 'motogp', 'moto2', 'moto3',
  'indycar', 'nascar', 'wec', 'imsa', 'dtm', 'nls', 'wsbk', 'superformula',
];
