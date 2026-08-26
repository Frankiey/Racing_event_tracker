export interface RaceSession {
  type: string;
  startTimeUTC: string;
}

export interface CircuitLapRecord {
  time: string;
  driver: string;
  car: string;
  year: number;
}

export interface Circuit {
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
  /** Circuit length in kilometers. Trivia field — not present for every circuit. */
  lengthKm?: number;
  /** Official lap record for the circuit. Trivia field — not present for every circuit. */
  lapRecord?: CircuitLapRecord;
}

export interface RaceEvent {
  id: string;
  seriesId: string;
  eventName: string;
  round: number;
  circuit: Circuit;
  sessions: RaceSession[];
  dateStart: string;
  dateEnd: string;
}

export interface EventFeed<T = RaceEvent> {
  events: T[];
}
