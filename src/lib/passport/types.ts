export interface PassportEvent {
  id: string;
  seriesId: string;
  round: number;
  lat: number;
  lng: number;
  dateStart: string;
  dateEnd: string;
  isPast: boolean;
  name: string;
  circuit: string;
  country: string;
  countryCode?: string;
  city?: string;
  [key: string]: unknown;
}

export interface PassportFullEvent {
  id: string;
  [key: string]: unknown;
}

export interface PassportSeriesMeta {
  color?: string;
  shortLabel?: string;
}

export type PassportSeriesMetaMap = Record<string, PassportSeriesMeta>;

export interface ProjectedPassportEvent extends PassportEvent {
  px: number;
  py: number;
  d: number;
}

export interface PassportRenderState {
  activeFilter: string;
  hoveredEvent: ProjectedPassportEvent | null;
  selectedEvent: PassportEvent | null;
  autoRotate: boolean;
  lastInteraction: number;
  currentRotation: [number, number, number];
  velocityX: number;
  scaleFactor: number;
  flightProgress: number;
  flightActive: boolean;
  flightPaused: boolean;
  followPlane: boolean;
  flightSeries: string;
  lastFlightSegIndex: number;
  isDragging: boolean;
  projectedDots: ProjectedPassportEvent[];
}