export interface RaceSession {
  type: string;
  startTimeUTC: string;
}

export interface Circuit {
  name: string;
  city: string;
  country: string;
  countryCode: string;
  lat: number | null;
  lng: number | null;
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
